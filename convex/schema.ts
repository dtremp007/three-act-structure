import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  sketches: defineTable({
    title: v.string(),
    duration: v.optional(v.number()),
    description: v.optional(v.string()),
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
    name: v.string(),
    status: v.union(v.literal("idea"), v.literal("planned"), v.literal("ready")),
    responsiblePersonId: v.optional(v.id("teamMembers")),
    notes: v.optional(v.string()),
  }),

  propMedia: defineTable({
    propId: v.id("props"),
    fileId: v.id("_storage"),
    fileName: v.string(),
    fileType: v.string(),
    width: v.optional(v.number()),
    height: v.optional(v.number()),
    createdAt: v.number(),
  }).index("by_prop", ["propId"]),

  sketchMedia: defineTable({
    sketchId: v.id("sketches"),
    fileId: v.id("_storage"),
    fileName: v.string(),
    fileType: v.string(),
    width: v.optional(v.number()),
    height: v.optional(v.number()),
    createdAt: v.number(),
  }).index("by_sketch", ["sketchId"]),

  sketchProps: defineTable({
    sketchId: v.id("sketches"),
    propId: v.id("props"),
  }).index("by_sketch", ["sketchId"])
    .index("by_prop", ["propId"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
