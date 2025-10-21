import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("sketches"),
      _creationTime: v.number(),
      title: v.string(),
      duration: v.optional(v.number()),
      description: v.optional(v.string()),
      order: v.number(),
    })
  ),
  handler: async (ctx) => {
    const sketches = await ctx.db
      .query("sketches")
      .withIndex("by_order")
      .order("asc")
      .collect();

    return sketches;
  },
});

export const get = query({
  args: { id: v.id("sketches") },
  returns: v.union(
    v.object({
      _id: v.id("sketches"),
      _creationTime: v.number(),
      title: v.string(),
      duration: v.optional(v.number()),
      description: v.optional(v.string()),
      order: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const sketch = await ctx.db.get(args.id);
    if (!sketch) return null;

    return sketch;
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    duration: v.optional(v.number()),
  },
  returns: v.id("sketches"),
  handler: async (ctx, args) => {
    const sketches = await ctx.db.query("sketches").collect();
    const maxOrder = Math.max(...sketches.map(s => s.order), -1);

    return await ctx.db.insert("sketches", {
      title: args.title,
      duration: args.duration,
      order: maxOrder + 1,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("sketches"),
    title: v.optional(v.string()),
    duration: v.optional(v.number()),
    description: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
    return null;
  },
});

export const reorder = mutation({
  args: {
    sketchIds: v.array(v.id("sketches")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    for (let i = 0; i < args.sketchIds.length; i++) {
      await ctx.db.patch(args.sketchIds[i], { order: i });
    }
    return null;
  },
});

export const remove = mutation({
  args: { id: v.id("sketches") },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Delete all characters
    const characters = await ctx.db
      .query("characters")
      .withIndex("by_sketch", (q) => q.eq("sketchId", args.id))
      .collect();
    for (const character of characters) {
      await ctx.db.delete(character._id);
    }

    // Delete all prop associations
    const sketchProps = await ctx.db
      .query("sketchProps")
      .withIndex("by_sketch", (q) => q.eq("sketchId", args.id))
      .collect();
    for (const sketchProp of sketchProps) {
      await ctx.db.delete(sketchProp._id);
    }

    // Delete all scripts
    const scripts = await ctx.db
      .query("scripts")
      .withIndex("by_sketch", (q) => q.eq("sketchId", args.id))
      .collect();
    for (const script of scripts) {
      await ctx.storage.delete(script.fileId);
      await ctx.db.delete(script._id);
    }

    // Delete all media files
    const mediaFiles = await ctx.db
      .query("sketchMedia")
      .withIndex("by_sketch", (q) => q.eq("sketchId", args.id))
      .collect();
    for (const media of mediaFiles) {
      await ctx.storage.delete(media.fileId);
      await ctx.db.delete(media._id);
    }

    // Finally, delete the sketch itself
    await ctx.db.delete(args.id);
    return null;
  },
});

export const generateUploadUrl = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

// Query media files for a sketch
export const listMedia = query({
  args: { sketchId: v.id("sketches") },
  returns: v.array(
    v.object({
      _id: v.id("sketchMedia"),
      _creationTime: v.number(),
      sketchId: v.id("sketches"),
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
      .query("sketchMedia")
      .withIndex("by_sketch", (q) => q.eq("sketchId", args.sketchId))
      .collect();

    return await Promise.all(
      mediaFiles.map(async (media) => ({
        ...media,
        fileUrl: await ctx.storage.getUrl(media.fileId),
      }))
    );
  },
});

// Add media file to a sketch
export const addMedia = mutation({
  args: {
    sketchId: v.id("sketches"),
    fileId: v.id("_storage"),
    fileName: v.string(),
    fileType: v.string(),
    width: v.optional(v.number()),
    height: v.optional(v.number()),
  },
  returns: v.id("sketchMedia"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("sketchMedia", {
      sketchId: args.sketchId,
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
  args: { id: v.id("sketchMedia") },
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
