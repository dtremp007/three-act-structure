import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const sketches = await ctx.db
      .query("sketches")
      .withIndex("by_order")
      .order("asc")
      .collect();
    
    return Promise.all(
      sketches.map(async (sketch) => ({
        ...sketch,
        imageUrl: sketch.imageId ? await ctx.storage.getUrl(sketch.imageId) : null,
      }))
    );
  },
});

export const get = query({
  args: { id: v.id("sketches") },
  handler: async (ctx, args) => {
    const sketch = await ctx.db.get(args.id);
    if (!sketch) return null;
    
    return {
      ...sketch,
      imageUrl: sketch.imageId ? await ctx.storage.getUrl(sketch.imageId) : null,
    };
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    duration: v.optional(v.string()),
  },
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
    duration: v.optional(v.string()),
    description: v.optional(v.string()),
    imageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

export const reorder = mutation({
  args: {
    sketchIds: v.array(v.id("sketches")),
  },
  handler: async (ctx, args) => {
    for (let i = 0; i < args.sketchIds.length; i++) {
      await ctx.db.patch(args.sketchIds[i], { order: i });
    }
  },
});

export const remove = mutation({
  args: { id: v.id("sketches") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});
