import { Router } from "express";
import { db, analyticsEventsTable } from "@workspace/db";
import { desc, gte, sql, count, countDistinct } from "drizzle-orm";

const router = Router();

// POST /api/analytics/event
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

// GET /api/analytics/summary
router.get("/analytics/summary", async (_req, res) => {
  const now = new Date();
  const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const last7d  = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  // All-time totals
  const [allTime] = await db
    .select({
      totalEvents:   count(),
      uniqueDevices: countDistinct(analyticsEventsTable.deviceId),
    })
    .from(analyticsEventsTable);

  // Today
  const [today] = await db
    .select({
      totalEvents:   count(),
      uniqueDevices: countDistinct(analyticsEventsTable.deviceId),
    })
    .from(analyticsEventsTable)
    .where(gte(analyticsEventsTable.createdAt, todayStart));

  // Last 7 days
  const [last7dStats] = await db
    .select({
      totalEvents:   count(),
      uniqueDevices: countDistinct(analyticsEventsTable.deviceId),
    })
    .from(analyticsEventsTable)
    .where(gte(analyticsEventsTable.createdAt, last7d));

  // Last 30 days
  const [last30dStats] = await db
    .select({
      totalEvents:   count(),
      uniqueDevices: countDistinct(analyticsEventsTable.deviceId),
    })
    .from(analyticsEventsTable)
    .where(gte(analyticsEventsTable.createdAt, last30d));

  // Events per day — last 30 days
  const perDay = await db
    .select({
      date:          sql<string>`DATE(${analyticsEventsTable.createdAt})`.as("date"),
      events:        count(),
      uniqueDevices: countDistinct(analyticsEventsTable.deviceId),
    })
    .from(analyticsEventsTable)
    .where(gte(analyticsEventsTable.createdAt, last30d))
    .groupBy(sql`DATE(${analyticsEventsTable.createdAt})`)
    .orderBy(sql`DATE(${analyticsEventsTable.createdAt})`);

  // Events per hour — last 24h
  const perHour = await db
    .select({
      hour:          sql<number>`EXTRACT(HOUR FROM ${analyticsEventsTable.createdAt})::int`.as("hour"),
      events:        count(),
      uniqueDevices: countDistinct(analyticsEventsTable.deviceId),
    })
    .from(analyticsEventsTable)
    .where(gte(analyticsEventsTable.createdAt, last24h))
    .groupBy(sql`EXTRACT(HOUR FROM ${analyticsEventsTable.createdAt})`)
    .orderBy(sql`EXTRACT(HOUR FROM ${analyticsEventsTable.createdAt})`);

  // Feature popularity — event breakdown by type (all time)
  const featurePopularity = await db
    .select({
      feature: analyticsEventsTable.eventType,
      count:   count(),
    })
    .from(analyticsEventsTable)
    .groupBy(analyticsEventsTable.eventType)
    .orderBy(desc(count()));

  // Feature popularity — last 7 days
  const featurePopularity7d = await db
    .select({
      feature: analyticsEventsTable.eventType,
      count:   count(),
    })
    .from(analyticsEventsTable)
    .where(gte(analyticsEventsTable.createdAt, last7d))
    .groupBy(analyticsEventsTable.eventType)
    .orderBy(desc(count()));

  // Location distribution — top cities (from metadata->>'city')
  const locationDistribution = await db
    .select({
      city:          sql<string>`metadata->>'city'`.as("city"),
      uniqueDevices: countDistinct(analyticsEventsTable.deviceId),
      opens:         count(),
    })
    .from(analyticsEventsTable)
    .where(sql`metadata->>'city' IS NOT NULL`)
    .groupBy(sql`metadata->>'city'`)
    .orderBy(desc(countDistinct(analyticsEventsTable.deviceId)))
    .limit(50);

  // Recent events — last 20
  const recent = await db
    .select()
    .from(analyticsEventsTable)
    .orderBy(desc(analyticsEventsTable.createdAt))
    .limit(20);

  // Add percentages to feature popularity
  const totalFeatureCount = featurePopularity.reduce((s, r) => s + Number(r.count), 0);
  const featuresWithPct = featurePopularity.map(r => ({
    ...r,
    pct: totalFeatureCount > 0
      ? Math.round((Number(r.count) / totalFeatureCount) * 100)
      : 0,
  }));

  res.json({
    allTime,
    today,
    last7Days:           last7dStats,
    last30Days:          last30dStats,
    perDay,
    perHour,
    featurePopularity:   featuresWithPct,
    featurePopularity7d,
    locationDistribution,
    recent,
  });
});

export default router;
