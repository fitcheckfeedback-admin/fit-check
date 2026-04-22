import cron from "node-cron";
import { db, pushSubscriptionsTable, remindersTable } from "@workspace/db";
import { eq, lte, and } from "drizzle-orm";
import webpush from "web-push";
import { logger } from "./logger";

export function startScheduler() {
  logger.info("Starting push notification scheduler");

  cron.schedule("* * * * *", async () => {
    try {
      const dueReminders = await db.select()
        .from(remindersTable)
        .where(
          and(
            eq(remindersTable.fired, false),
            lte(remindersTable.scheduledAt, new Date())
          )
        );

      if (dueReminders.length === 0) return;

      const subs = await db.select().from(pushSubscriptionsTable);

      for (const reminder of dueReminders) {
        for (const sub of subs) {
          try {
            await webpush.sendNotification({
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.p256dh,
                auth: sub.auth
              }
            }, JSON.stringify({
              title: "Reminder",
              body: reminder.title,
              url: "/reminders"
            }));
          } catch (e: any) {
            if (e.statusCode === 404 || e.statusCode === 410) {
              await db.delete(pushSubscriptionsTable).where(eq(pushSubscriptionsTable.endpoint, sub.endpoint));
            }
          }
        }
        await db.update(remindersTable)
          .set({ fired: true })
          .where(eq(remindersTable.id, reminder.id));
      }
    } catch (error) {
      logger.error({ error }, "Error in reminder cron job");
    }
  });

  cron.schedule("0 8 * * *", async () => {
    try {
      const subs = await db.select().from(pushSubscriptionsTable);
      for (const sub of subs) {
        try {
          await webpush.sendNotification({
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth
            }
          }, JSON.stringify({
            title: "Good morning - time to get dressed!",
            body: "Check your outfit for today's weather.",
            url: "/"
          }));
        } catch (e: any) {
          if (e.statusCode === 404 || e.statusCode === 410) {
            await db.delete(pushSubscriptionsTable).where(eq(pushSubscriptionsTable.endpoint, sub.endpoint));
          }
        }
      }
    } catch (error) {
      logger.error({ error }, "Error in daily outfit cron job");
    }
  });
}