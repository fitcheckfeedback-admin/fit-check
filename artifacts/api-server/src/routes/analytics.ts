import { Router } from "express";
import { db, analyticsEventsTable } from "@workspace/db";
import { desc, gte, sql, count, countDistinct } from "drizzle-orm";

const router = Router();

// POST /api/analytics/event — log an event
router.post("/analytics/event", async (req, res) => {
  const { deviceId, eventType, metadata } = req.body;
  if (!deviceId || !eventType) {
    res.status(400).json({ error: "deviceId and eventType are required" });
    return;
  }
  await db.insert(analyticsEventsTable).values({
    deviceId,
    eventType,
    metadata: metadata ?? null,
  });
  res.status(201).json({ ok: true });
});

// GET /api/analytics/summary — full usage summary
router.get("/analytics/summary", async (_req, res) => {
  const now = new Date();
  const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // All-time totals
  const [totals] = await db
    .select({
      totalEvents: count(),
      uniqueDevices: countDistinct(analyticsEventsTable.deviceId),
    })
    .from(analyticsEventsTable);

  // Today's totals
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const [today] = await db
    .select({
      totalEvents: count(),
      uniqueDevices: countDistinct(analyticsEventsTable.deviceId),
    })
    .from(analyticsEventsTable)
    .where(gte(analyticsEventsTable.createdAt, todayStart));

  // Events per day — last 30 days
  const perDay = await db
    .select({
      date: sql<string>`DATE(${analyticsEventsTable.createdAt})`.as("date"),
      events: count(),
      uniqueDevices: countDistinct(analyticsEventsTable.deviceId),
    })
    .from(analyticsEventsTable)
    .where(gte(analyticsEventsTable.createdAt, last30d))
    .groupBy(sql`DATE(${analyticsEventsTable.createdAt})`)
    .orderBy(sql`DATE(${analyticsEventsTable.createdAt})`);

  // Events per hour — last 24h
  const perHour = await db
    .select({
      hour: sql<number>`EXTRACT(HOUR FROM ${analyticsEventsTable.createdAt})::int`.as("hour"),
      events: count(),
      uniqueDevices: countDistinct(analyticsEventsTable.deviceId),
    })
    .from(analyticsEventsTable)
    .where(gte(analyticsEventsTable.createdAt, last24h))
    .groupBy(sql`EXTRACT(HOUR FROM ${analyticsEventsTable.createdAt})`)
    .orderBy(sql`EXTRACT(HOUR FROM ${analyticsEventsTable.createdAt})`);

  // Event breakdown by type — all time
  const byType = await db
    .select({
      eventType: analyticsEventsTable.eventType,
      count: count(),
    })
    .from(analyticsEventsTable)
    .groupBy(analyticsEventsTable.eventType)
    .orderBy(desc(count()));

  // Recent events — last 20
  const recent = await db
    .select()
    .from(analyticsEventsTable)
    .orderBy(desc(analyticsEventsTable.createdAt))
    .limit(20);

  res.json({
    allTime: totals,
    today,
    perDay,
    perHour,
    byType,
    recent,
  });
});

export default router;
