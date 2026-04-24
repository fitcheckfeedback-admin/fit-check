import { pgTable, text, timestamp, uuid, jsonb } from "drizzle-orm/pg-core";

export const analyticsEventsTable = pgTable("analytics_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  deviceId: text("device_id").notNull(),
  eventType: text("event_type").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type AnalyticsEvent = typeof analyticsEventsTable.$inferSelect;

export const excludedDevicesTable = pgTable("excluded_devices", {
  deviceId: text("device_id").primaryKey(),
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type ExcludedDevice = typeof excludedDevicesTable.$inferSelect;

export const premiumAccessTable = pgTable("premium_access", {
  deviceId: text("device_id").primaryKey(),
  note: text("note"),
  grantedAt: timestamp("granted_at").defaultNow().notNull(),
});

export type PremiumAccess = typeof premiumAccessTable.$inferSelect;
