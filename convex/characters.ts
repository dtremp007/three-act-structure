import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: { sketchId: v.id("sketches") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("characters")
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
    return await ctx.db.insert("characters", {
      sketchId: args.sketchId,
      name: args.name,
      assignedTo: undefined,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("characters"),
    name: v.optional(v.string()),
    assignedTo: v.optional(v.union(v.id("teamMembers"), v.null())),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const patchData: any = {};
    if (updates.name !== undefined) patchData.name = updates.name;
    if (updates.assignedTo !== undefined) {
      patchData.assignedTo = updates.assignedTo === null ? undefined : updates.assignedTo;
    }
    await ctx.db.patch(id, patchData);
  },
});

export const remove = mutation({
  args: { id: v.id("characters") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
