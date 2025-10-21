import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getLatest = query({
  args: { sketchId: v.id("sketches") },
  handler: async (ctx, args) => {
    const scripts = await ctx.db
      .query("scripts")
      .withIndex("by_sketch", (q) => q.eq("sketchId", args.sketchId))
      .order("desc")
      .take(1);
    
    const script = scripts[0];
    if (!script) return null;

    return {
      ...script,
      fileUrl: await ctx.storage.getUrl(script.fileId),
    };
  },
});

export const getVersions = query({
  args: { sketchId: v.id("sketches") },
  handler: async (ctx, args) => {
    const scripts = await ctx.db
      .query("scripts")
      .withIndex("by_sketch", (q) => q.eq("sketchId", args.sketchId))
      .order("desc")
      .collect();

    return Promise.all(
      scripts.map(async (script) => ({
        ...script,
        fileUrl: await ctx.storage.getUrl(script.fileId),
      }))
    );
  },
});

export const create = mutation({
  args: {
    sketchId: v.id("sketches"),
    fileId: v.id("_storage"),
    fileName: v.string(),
  },
  handler: async (ctx, args) => {
    const existingScripts = await ctx.db
      .query("scripts")
      .withIndex("by_sketch", (q) => q.eq("sketchId", args.sketchId))
      .collect();
    
    const nextVersion = Math.max(...existingScripts.map(s => s.version), 0) + 1;
    
    return await ctx.db.insert("scripts", {
      sketchId: args.sketchId,
      fileId: args.fileId,
      fileName: args.fileName,
      version: nextVersion,
      createdAt: Date.now(),
    });
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});
