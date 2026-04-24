import { Router } from "express";
import { db, premiumAccessTable } from "@workspace/db";
import { eq } from "drizzle-orm";
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

// GET /api/premium/status?deviceId=xxx — public, checks if a device has premium
router.get("/premium/status", async (req, res) => {
  const deviceId = req.query.deviceId as string;
  if (!deviceId) {
    res.status(400).json({ error: "deviceId required" });
    return;
  }
  const [row] = await db
    .select()
    .from(premiumAccessTable)
    .where(eq(premiumAccessTable.deviceId, deviceId))
    .limit(1);
  res.json({ isPro: !!row, grantedAt: row?.grantedAt ?? null });
});

// GET /api/premium/list — authenticated, list all granted devices
router.get("/premium/list", async (req, res) => {
  if (!isAuthorized(req)) { res.status(401).json({ error: "Unauthorized" }); return; }
  const rows = await db.select().from(premiumAccessTable);
  res.json(rows);
});

// POST /api/premium/grant — authenticated, grant access to a device
router.post("/premium/grant", async (req, res) => {
  if (!isAuthorized(req)) { res.status(401).json({ error: "Unauthorized" }); return; }
  const { deviceId, note } = req.body;
  if (!deviceId) { res.status(400).json({ error: "deviceId required" }); return; }
  await db
    .insert(premiumAccessTable)
    .values({ deviceId, note: note ?? "Manually granted" })
    .onConflictDoNothing();
  res.status(201).json({ ok: true });
});

// DELETE /api/premium/revoke/:deviceId — authenticated, revoke access
router.delete("/premium/revoke/:deviceId", async (req, res) => {
  if (!isAuthorized(req)) { res.status(401).json({ error: "Unauthorized" }); return; }
  await db.delete(premiumAccessTable).where(eq(premiumAccessTable.deviceId, req.params.deviceId));
  res.json({ ok: true });
});

export default router;
