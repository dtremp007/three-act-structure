import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  sketches: defineTable({
    title: v.string(),
    duration: v.optional(v.string()),
    description: v.optional(v.string()),
    imageId: v.optional(v.id("_storage")),
    order: v.number(),
  }).index("by_order", ["order"]),

  teamMembers: defineTable({
    name: v.string(),
    order: v.number(),
  }).index("by_order", ["order"]),

  scripts: defineTable({
    sketchId: v.id("sketches"),
    fileId: v.id("_storage"),
    fileName: v.string(),
    version: v.number(),
    createdAt: v.number(),
  }).index("by_sketch", ["sketchId"])
    .index("by_sketch_and_version", ["sketchId", "version"]),

  characters: defineTable({
    sketchId: v.id("sketches"),
    name: v.string(),
    assignedTo: v.optional(v.id("teamMembers")),
  }).index("by_sketch", ["sketchId"]),

  props: defineTable({
    sketchId: v.id("sketches"),
    name: v.string(),
    acquired: v.boolean(),
  }).index("by_sketch", ["sketchId"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
