import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";

// Query all props with responsible person details
export const list = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("props"),
      _creationTime: v.number(),
      name: v.string(),
      status: v.union(v.literal("idea"), v.literal("planned"), v.literal("ready")),
      responsiblePersonId: v.optional(v.id("teamMembers")),
      notes: v.optional(v.string()),
      responsiblePerson: v.optional(
        v.object({
          _id: v.id("teamMembers"),
          name: v.string(),
        })
      ),
    })
  ),
  handler: async (ctx) => {
    const props = await ctx.db.query("props").collect();

    return await Promise.all(
      props.map(async (prop) => {
        let responsiblePerson = undefined;
        if (prop.responsiblePersonId) {
          const person = await ctx.db.get(prop.responsiblePersonId);
          if (person) {
            responsiblePerson = {
              _id: person._id,
              name: person.name,
            };
          }
        }

        return {
          ...prop,
          responsiblePerson,
        };
      })
    );
  },
});

// Query single prop with full details
export const get = query({
  args: { id: v.id("props") },
  returns: v.union(
    v.object({
      _id: v.id("props"),
      _creationTime: v.number(),
      name: v.string(),
      status: v.union(v.literal("idea"), v.literal("planned"), v.literal("ready")),
      responsiblePersonId: v.optional(v.id("teamMembers")),
      notes: v.optional(v.string()),
      responsiblePerson: v.optional(
        v.object({
          _id: v.id("teamMembers"),
          name: v.string(),
        })
      ),
      sketches: v.array(
        v.object({
          _id: v.id("sketches"),
          title: v.string(),
        })
      ),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const prop = await ctx.db.get(args.id);
    if (!prop) return null;

    let responsiblePerson = undefined;
    if (prop.responsiblePersonId) {
      const person = await ctx.db.get(prop.responsiblePersonId);
      if (person) {
        responsiblePerson = {
          _id: person._id,
          name: person.name,
        };
      }
    }

    // Get sketches using this prop
    const sketchPropLinks = await ctx.db
      .query("sketchProps")
      .withIndex("by_prop", (q) => q.eq("propId", args.id))
      .collect();

    const sketches = await Promise.all(
      sketchPropLinks.map(async (link) => {
        const sketch = await ctx.db.get(link.sketchId);
        return sketch ? { _id: sketch._id, title: sketch.title } : null;
      })
    );

    return {
      ...prop,
      responsiblePerson,
      sketches: sketches.filter((s) => s !== null) as Array<{
        _id: Id<"sketches">;
        title: string;
      }>,
    };
  },
});

// Create global prop
export const create = mutation({
  args: {
    name: v.string(),
    status: v.optional(v.union(v.literal("idea"), v.literal("planned"), v.literal("ready"))),
    responsiblePersonId: v.optional(v.id("teamMembers")),
    notes: v.optional(v.string()),
  },
  returns: v.id("props"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("props", {
      name: args.name,
      status: args.status ?? "idea",
      responsiblePersonId: args.responsiblePersonId,
      notes: args.notes,
    });
  },
});

// Update prop fields
export const update = mutation({
  args: {
    id: v.id("props"),
    name: v.optional(v.string()),
    status: v.optional(v.union(v.literal("idea"), v.literal("planned"), v.literal("ready"))),
    responsiblePersonId: v.optional(v.id("teamMembers")),
    notes: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
    return null;
  },
});

// Delete prop and cleanup associations
export const remove = mutation({
  args: { id: v.id("props") },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Delete all sketch associations
    const sketchPropLinks = await ctx.db
      .query("sketchProps")
      .withIndex("by_prop", (q) => q.eq("propId", args.id))
      .collect();

    for (const link of sketchPropLinks) {
      await ctx.db.delete(link._id);
    }

    // Delete all media files
    const mediaFiles = await ctx.db
      .query("propMedia")
      .withIndex("by_prop", (q) => q.eq("propId", args.id))
      .collect();

    for (const media of mediaFiles) {
      await ctx.storage.delete(media.fileId);
      await ctx.db.delete(media._id);
    }

    // Delete the prop itself
    await ctx.db.delete(args.id);
    return null;
  },
});

// Query props associated with a specific sketch
export const listForSketch = query({
  args: { sketchId: v.id("sketches") },
  returns: v.array(
    v.object({
      _id: v.id("props"),
      _creationTime: v.number(),
      name: v.string(),
      status: v.union(v.literal("idea"), v.literal("planned"), v.literal("ready")),
      responsiblePersonId: v.optional(v.id("teamMembers")),
      notes: v.optional(v.string()),
    })
  ),
  handler: async (ctx, args) => {
    const sketchPropLinks = await ctx.db
      .query("sketchProps")
      .withIndex("by_sketch", (q) => q.eq("sketchId", args.sketchId))
      .collect();

    const props = await Promise.all(
      sketchPropLinks.map(async (link) => {
        return await ctx.db.get(link.propId);
      })
    );

    return props.filter((p) => p !== null) as Array<{
      _id: Id<"props">;
      _creationTime: number;
      name: string;
      status: "idea" | "planned" | "ready";
      responsiblePersonId?: Id<"teamMembers"> | undefined;
      notes?: string | undefined;
    }>;
  },
});

// Associate a prop with a sketch
export const addToSketch = mutation({
  args: {
    sketchId: v.id("sketches"),
    propId: v.id("props"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Check if association already exists
    const existing = await ctx.db
      .query("sketchProps")
      .withIndex("by_sketch", (q) => q.eq("sketchId", args.sketchId))
      .collect();

    const alreadyExists = existing.some((link) => link.propId === args.propId);

    if (!alreadyExists) {
      await ctx.db.insert("sketchProps", {
        sketchId: args.sketchId,
        propId: args.propId,
      });
    }

    return null;
  },
});

// Remove prop-sketch association
export const removeFromSketch = mutation({
  args: {
    sketchId: v.id("sketches"),
    propId: v.id("props"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const links = await ctx.db
      .query("sketchProps")
      .withIndex("by_sketch", (q) => q.eq("sketchId", args.sketchId))
      .collect();

    const link = links.find((l) => l.propId === args.propId);

    if (link) {
      await ctx.db.delete(link._id);
    }

    return null;
  },
});

// Query media files for a prop
export const listMedia = query({
  args: { propId: v.id("props") },
  returns: v.array(
    v.object({
      _id: v.id("propMedia"),
      _creationTime: v.number(),
      propId: v.id("props"),
      fileId: v.id("_storage"),
      fileName: v.string(),
      fileType: v.string(),
      width: v.optional(v.number()),
      height: v.optional(v.number()),
      createdAt: v.number(),
      fileUrl: v.union(v.string(), v.null()),
    })
  ),
  handler: async (ctx, args) => {
    const mediaFiles = await ctx.db
      .query("propMedia")
      .withIndex("by_prop", (q) => q.eq("propId", args.propId))
      .collect();

    return await Promise.all(
      mediaFiles.map(async (media) => ({
        ...media,
        fileUrl: await ctx.storage.getUrl(media.fileId),
      }))
    );
  },
});

// Add media file to a prop
export const addMedia = mutation({
  args: {
    propId: v.id("props"),
    fileId: v.id("_storage"),
    fileName: v.string(),
    fileType: v.string(),
    width: v.optional(v.number()),
    height: v.optional(v.number()),
  },
  returns: v.id("propMedia"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("propMedia", {
      propId: args.propId,
      fileId: args.fileId,
      fileName: args.fileName,
      fileType: args.fileType,
      width: args.width,
      height: args.height,
      createdAt: Date.now(),
    });
  },
});

// Remove media file
export const removeMedia = mutation({
  args: { id: v.id("propMedia") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const media = await ctx.db.get(args.id);
    if (media) {
      await ctx.storage.delete(media.fileId);
      await ctx.db.delete(args.id);
    }
    return null;
  },
});

// Generate upload URL for file uploads
export const generateUploadUrl = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});
