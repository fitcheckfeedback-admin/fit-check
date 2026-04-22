import { Router } from "express";
import { db, pushSubscriptionsTable, remindersTable } from "@workspace/db";
import { eq, asc } from "drizzle-orm";
import webpush from "web-push";

if (process.env.VAPID_EMAIL && process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_EMAIL,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

const router = Router();

router.post("/push/subscribe", async (req, res) => {
  const { endpoint, p256dh, auth } = req.body;
  if (!endpoint || !p256dh || !auth) {
    res.status(400).json({ error: "Missing subscription data" });
    return;
  }

  await db.insert(pushSubscriptionsTable).values({
    endpoint,
    p256dh,
    auth,
  }).onConflictDoUpdate({
    target: pushSubscriptionsTable.endpoint,
    set: {
      p256dh,
      auth,
    }
  });

  res.json({ ok: true });
});

router.delete("/push/subscribe", async (req, res) => {
  const { endpoint } = req.body;
  if (!endpoint) {
    res.status(400).json({ error: "Missing endpoint" });
    return;
  }

  await db.delete(pushSubscriptionsTable).where(eq(pushSubscriptionsTable.endpoint, endpoint));
  res.json({ ok: true });
});

router.get("/push/reminders", async (req, res) => {
  const { deviceId } = req.query;
  if (!deviceId || typeof deviceId !== 'string') {
    res.status(400).json({ error: "Missing deviceId" });
    return;
  }

  const reminders = await db.select()
    .from(remindersTable)
    .where(
      eq(remindersTable.deviceId, deviceId)
    )
    .orderBy(asc(remindersTable.scheduledAt));
  
  const filtered = reminders.filter(r => !r.fired && new Date(r.scheduledAt) > new Date());

  res.json(filtered);
});

router.post("/push/reminders", async (req, res) => {
  const { deviceId, title, scheduledAt } = req.body;
  if (!deviceId || !title || !scheduledAt) {
    res.status(400).json({ error: "Missing fields" });
    return;
  }

  const [reminder] = await db.insert(remindersTable).values({
    deviceId,
    title,
    scheduledAt: new Date(scheduledAt),
  }).returning();

  res.json(reminder);
});

router.delete("/push/reminders/:id", async (req, res) => {
  const { id } = req.params;
  await db.delete(remindersTable).where(eq(remindersTable.id, id));
  res.json({ ok: true });
});

router.post("/push/test", async (req, res) => {
  const { message } = req.body;
  
  const subs = await db.select().from(pushSubscriptionsTable);
  let sent = 0;

  for (const sub of subs) {
    try {
      await webpush.sendNotification({
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth
        }
      }, JSON.stringify({
        title: "Test Notification",
        body: message || "This is a test notification.",
        url: "/"
      }));
      sent++;
    } catch (e: any) {
      if (e.statusCode === 404 || e.statusCode === 410) {
        await db.delete(pushSubscriptionsTable).where(eq(pushSubscriptionsTable.endpoint, sub.endpoint));
      }
    }
  }

  res.json({ sent });
});

export default router;