import { Router } from "express";
import { db, analyticsEventsTable, excludedDevicesTable } from "@workspace/db";
import { desc, gte, sql, count, countDistinct, notInArray, and, eq } from "drizzle-orm";
import crypto from "crypto";

const router = Router();

function getToken(): string {
  const secret = process.env.SESSION_SECRET ?? "fallback-secret";
  const password = process.env.ANALYTICS_PASSWORD ?? "";
  return crypto.createHmac("sha256", secret).update(password).digest("hex");
}

function isAuthorized(req: { headers: Record<string, string | string[] | undefined> }): boolean {
  const auth = req.headers["authorization"];
  if (!auth || typeof auth !== "string") return false;
  const token = auth.replace(/^Bearer\s+/i, "").trim();
  return token === getToken();
}

async function getExcludedIds(): Promise<string[]> {
  const rows = await db.select({ deviceId: excludedDevicesTable.deviceId }).from(excludedDevicesTable);
  return rows.map(r => r.deviceId);
}

// POST /api/analytics/auth — validate password, return token
router.post("/analytics/auth", (req, res) => {
  const { password } = req.body;
  if (!password || password !== process.env.ANALYTICS_PASSWORD) {
    res.status(401).json({ error: "Invalid password" });
    return;
  }
  res.json({ token: getToken() });
});

// POST /api/analytics/event — always open (client-side tracking)
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

// GET /api/analytics/excluded-devices — list excluded devices
router.get("/analytics/excluded-devices", async (req, res) => {
  if (!isAuthorized(req)) { res.status(401).json({ error: "Unauthorized" }); return; }
  const rows = await db.select().from(excludedDevicesTable).orderBy(desc(excludedDevicesTable.createdAt));
  res.json(rows);
});

// POST /api/analytics/excluded-devices — add a device
router.post("/analytics/excluded-devices", async (req, res) => {
  if (!isAuthorized(req)) { res.status(401).json({ error: "Unauthorized" }); return; }
  const { deviceId, note } = req.body;
  if (!deviceId) { res.status(400).json({ error: "deviceId required" }); return; }
  await db.insert(excludedDevicesTable).values({ deviceId, note: note ?? null }).onConflictDoNothing();
  res.status(201).json({ ok: true });
});

// DELETE /api/analytics/excluded-devices/:deviceId — remove exclusion
router.delete("/analytics/excluded-devices/:deviceId", async (req, res) => {
  if (!isAuthorized(req)) { res.status(401).json({ error: "Unauthorized" }); return; }
  await db.delete(excludedDevicesTable).where(eq(excludedDevicesTable.deviceId, req.params.deviceId));
  res.json({ ok: true });
});

// GET /api/analytics/summary — requires auth token
router.get("/analytics/summary", async (req, res) => {
  if (!isAuthorized(req)) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const excludedIds = await getExcludedIds();
  const excluded = excludedIds.length > 0
    ? (col: typeof analyticsEventsTable.deviceId) => notInArray(col, excludedIds)
    : null;

  function withExclusion(baseCondition?: ReturnType<typeof gte>) {
    if (!excluded && !baseCondition) return undefined;
    if (!excluded) return baseCondition;
    if (!baseCondition) return excluded(analyticsEventsTable.deviceId);
    return and(baseCondition, excluded(analyticsEventsTable.deviceId));
  }

  const now = new Date();
  const last24h  = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const last7d   = new Date(now.getTime() - 7  * 24 * 60 * 60 * 1000);
  const last30d  = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  // Use rolling 24h window instead of UTC midnight so it's timezone-agnostic
  const todayStart = last24h;

  const [allTime] = await db
    .select({ totalEvents: count(), uniqueDevices: countDistinct(analyticsEventsTable.deviceId) })
    .from(analyticsEventsTable)
    .where(withExclusion());

  const [today] = await db
    .select({ totalEvents: count(), uniqueDevices: countDistinct(analyticsEventsTable.deviceId) })
    .from(analyticsEventsTable)
    .where(withExclusion(gte(analyticsEventsTable.createdAt, todayStart)));

  const [last7dStats] = await db
    .select({ totalEvents: count(), uniqueDevices: countDistinct(analyticsEventsTable.deviceId) })
    .from(analyticsEventsTable)
    .where(withExclusion(gte(analyticsEventsTable.createdAt, last7d)));

  const [last30dStats] = await db
    .select({ totalEvents: count(), uniqueDevices: countDistinct(analyticsEventsTable.deviceId) })
    .from(analyticsEventsTable)
    .where(withExclusion(gte(analyticsEventsTable.createdAt, last30d)));

  const perDay = await db
    .select({
      date: sql<string>`DATE(${analyticsEventsTable.createdAt})`.as("date"),
      events: count(),
      uniqueDevices: countDistinct(analyticsEventsTable.deviceId),
    })
    .from(analyticsEventsTable)
    .where(withExclusion(gte(analyticsEventsTable.createdAt, last30d)))
    .groupBy(sql`DATE(${analyticsEventsTable.createdAt})`)
    .orderBy(sql`DATE(${analyticsEventsTable.createdAt})`);

  const perHour = await db
    .select({
      hour: sql<number>`EXTRACT(HOUR FROM ${analyticsEventsTable.createdAt})::int`.as("hour"),
      events: count(),
      uniqueDevices: countDistinct(analyticsEventsTable.deviceId),
    })
    .from(analyticsEventsTable)
    .where(withExclusion(gte(analyticsEventsTable.createdAt, last24h)))
    .groupBy(sql`EXTRACT(HOUR FROM ${analyticsEventsTable.createdAt})`)
    .orderBy(sql`EXTRACT(HOUR FROM ${analyticsEventsTable.createdAt})`);

  const featurePopularity = await db
    .select({ feature: analyticsEventsTable.eventType, count: count() })
    .from(analyticsEventsTable)
    .where(withExclusion())
    .groupBy(analyticsEventsTable.eventType)
    .orderBy(desc(count()));

  const featurePopularity7d = await db
    .select({ feature: analyticsEventsTable.eventType, count: count() })
    .from(analyticsEventsTable)
    .where(withExclusion(gte(analyticsEventsTable.createdAt, last7d)))
    .groupBy(analyticsEventsTable.eventType)
    .orderBy(desc(count()));

  const locationDistribution = await db
    .select({
      city: sql<string>`metadata->>'city'`.as("city"),
      uniqueDevices: countDistinct(analyticsEventsTable.deviceId),
      opens: count(),
    })
    .from(analyticsEventsTable)
    .where(
      excluded
        ? and(
            sql`metadata->>'city' IS NOT NULL AND metadata->>'city' != 'Current Location' AND trim(metadata->>'city') != ''`,
            excluded(analyticsEventsTable.deviceId),
          )
        : sql`metadata->>'city' IS NOT NULL AND metadata->>'city' != 'Current Location' AND trim(metadata->>'city') != ''`
    )
    .groupBy(sql`metadata->>'city'`)
    .orderBy(desc(countDistinct(analyticsEventsTable.deviceId)))
    .limit(100);

  const recentBase = db
    .select()
    .from(analyticsEventsTable)
    .orderBy(desc(analyticsEventsTable.createdAt))
    .limit(30);

  const recent = excludedIds.length > 0
    ? await db
        .select()
        .from(analyticsEventsTable)
        .where(notInArray(analyticsEventsTable.deviceId, excludedIds))
        .orderBy(desc(analyticsEventsTable.createdAt))
        .limit(30)
    : await recentBase;

  // Average session duration — all time
  const [avgSessionAll] = await db
    .select({
      avgSeconds: sql<number>`ROUND(AVG((${analyticsEventsTable.metadata}->>'durationSeconds')::numeric))`.as("avgSeconds"),
    })
    .from(analyticsEventsTable)
    .where(
      excluded
        ? and(
            sql`${analyticsEventsTable.eventType} = 'session_end'`,
            sql`${analyticsEventsTable.metadata}->>'durationSeconds' IS NOT NULL`,
            excluded(analyticsEventsTable.deviceId),
          )
        : sql`${analyticsEventsTable.eventType} = 'session_end' AND ${analyticsEventsTable.metadata}->>'durationSeconds' IS NOT NULL`
    );

  // Average session duration — today
  const [avgSessionToday] = await db
    .select({
      avgSeconds: sql<number>`ROUND(AVG((${analyticsEventsTable.metadata}->>'durationSeconds')::numeric))`.as("avgSeconds"),
    })
    .from(analyticsEventsTable)
    .where(
      excluded
        ? and(
            sql`${analyticsEventsTable.eventType} = 'session_end'`,
            sql`${analyticsEventsTable.metadata}->>'durationSeconds' IS NOT NULL`,
            gte(analyticsEventsTable.createdAt, todayStart),
            excluded(analyticsEventsTable.deviceId),
          )
        : and(
            sql`${analyticsEventsTable.eventType} = 'session_end'`,
            sql`${analyticsEventsTable.metadata}->>'durationSeconds' IS NOT NULL`,
            gte(analyticsEventsTable.createdAt, todayStart),
          )
    );

  const totalFeatureCount = featurePopularity.reduce((s, r) => s + Number(r.count), 0);
  const featuresWithPct = featurePopularity.map(r => ({
    ...r,
    pct: totalFeatureCount > 0 ? Math.round((Number(r.count) / totalFeatureCount) * 100) : 0,
  }));

  res.json({
    allTime,
    today,
    last7Days: last7dStats,
    last30Days: last30dStats,
    perDay,
    perHour,
    featurePopularity: featuresWithPct,
    featurePopularity7d,
    locationDistribution,
    recent,
    excludedCount: excludedIds.length,
    avgSessionSecondsAllTime: avgSessionAll?.avgSeconds ? Number(avgSessionAll.avgSeconds) : null,
    avgSessionSecondsToday: avgSessionToday?.avgSeconds ? Number(avgSessionToday.avgSeconds) : null,
  });
});

export default router;
