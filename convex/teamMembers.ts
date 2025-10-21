import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("teamMembers")
      .withIndex("by_order")
      .order("asc")
      .collect();
  },
});

export const create = mutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    const members = await ctx.db.query("teamMembers").collect();
    const maxOrder = Math.max(...members.map(m => m.order), -1);
    
    return await ctx.db.insert("teamMembers", {
      name: args.name,
      order: maxOrder + 1,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("teamMembers"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { name: args.name });
  },
});

export const remove = mutation({
  args: { id: v.id("teamMembers") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
