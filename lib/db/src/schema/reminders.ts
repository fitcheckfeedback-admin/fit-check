import { pgTable, text, timestamp, uuid, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const remindersTable = pgTable("reminders", {
  id: uuid("id").primaryKey().defaultRandom(),
  // Loose identity — no auth, just a device ID stored in localStorage
  deviceId: text("device_id").notNull(),
  title: text("title").notNull(),
  // ISO datetime string for one-time reminders, or a cron expression
  scheduledAt: timestamp("scheduled_at").notNull(),
  // Whether the notification was already fired
  fired: boolean("fired").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertReminderSchema = createInsertSchema(remindersTable).omit({ id: true, fired: true, createdAt: true });
export type InsertReminder = z.infer<typeof insertReminderSchema>;
export type Reminder = typeof remindersTable.$inferSelect;
