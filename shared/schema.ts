import { pgTable, text, integer, boolean, timestamp, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ── Storms ────────────────────────────────────────────────────────────────────
export const storms = pgTable("storms", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  location: text("location").notNull(),
  need: text("need").notNull(), // e.g. "meals", "rides", "childcare", "emotional support"
  status: text("status").notNull().default("active"), // active | completed | reviewing
  stewardName: text("steward_name").notNull(),
  stewardAvatar: text("steward_avatar"),
  participantCount: integer("participant_count").notNull().default(0),
  dropCount: integer("drop_count").notNull().default(0),
  targetDrops: integer("target_drops").notNull().default(10),
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at"),
  tags: text("tags").array().default([]),
  urgency: text("urgency").notNull().default("medium"), // low | medium | high | critical
  verified: boolean("verified").notNull().default(false),
});

export const insertStormSchema = createInsertSchema(storms).omit({ id: true, createdAt: true });
export type InsertStorm = z.infer<typeof insertStormSchema>;
export type Storm = typeof storms.$inferSelect;

// ── Drops (actions taken during a storm) ─────────────────────────────────────
export const drops = pgTable("drops", {
  id: serial("id").primaryKey(),
  stormId: integer("storm_id").notNull(),
  actorName: text("actor_name").notNull(),
  actorAvatar: text("actor_avatar"),
  action: text("action").notNull(), // what they committed to doing
  category: text("category").notNull().default("support"), // meals | transport | emotional | financial | volunteer
  note: text("note"),
  completed: boolean("completed").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertDropSchema = createInsertSchema(drops).omit({ id: true, createdAt: true });
export type InsertDrop = z.infer<typeof insertDropSchema>;
export type Drop = typeof drops.$inferSelect;

// ── Requests (people in need requesting a storm) ──────────────────────────────
export const requests = pgTable("requests", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  location: text("location").notNull(),
  needCategory: text("need_category").notNull(),
  urgency: text("urgency").notNull().default("medium"),
  contactEmail: text("contact_email"),
  status: text("status").notNull().default("pending"), // pending | approved | rejected | stormCreated
  stewardNote: text("steward_note"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertRequestSchema = createInsertSchema(requests).omit({ id: true, createdAt: true });
export type InsertRequest = z.infer<typeof insertRequestSchema>;
export type Request = typeof requests.$inferSelect;
