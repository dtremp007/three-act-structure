import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: { sketchId: v.id("sketches") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("props")
      .withIndex("by_sketch", (q) => q.eq("sketchId", args.sketchId))
      .collect();
  },
});

export const create = mutation({
  args: {
    sketchId: v.id("sketches"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("props", {
      sketchId: args.sketchId,
      name: args.name,
      acquired: false,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("props"),
    name: v.optional(v.string()),
    acquired: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

export const remove = mutation({
  args: { id: v.id("props") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
