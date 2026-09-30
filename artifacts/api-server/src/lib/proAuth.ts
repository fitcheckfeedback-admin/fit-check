import { db, premiumAccessTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "./logger";

/**
 * Server-side Pro check for cost-bearing endpoints (deal search).
 * A client-asserted "I'm Pro" flag is NOT accepted on its own — either:
 *  1. deviceId exists in premium_access (web/Stripe purchases + manual grants), or
 *  2. rcUserId (RevenueCat app user id) verifies live against RevenueCat's API.
 *
 * #2 needs REVENUECAT_SECRET_KEY in the environment (RevenueCat dashboard →
 * API keys → Secret). Results are cached 1h in memory; a restart just means
 * re-verification, never a wrong answer.
 */

const PRO_ENTITLEMENT = "pro";
const CACHE_TTL_MS = 60 * 60 * 1000;
const NEGATIVE_CACHE_TTL_MS = 5 * 60 * 1000;

interface CacheEntry {
  pro: boolean;
  exp: number;
}

const rcCache = new Map<string, CacheEntry>();

async function verifyRevenueCat(rcUserId: string): Promise<boolean> {
  const key = process.env.REVENUECAT_SECRET_KEY;
  if (!key) {
    logger.warn("REVENUECAT_SECRET_KEY not set — native Pro verification unavailable");
    return false;
  }
  const now = Date.now();
  const hit = rcCache.get(rcUserId);
  if (hit && hit.exp > now) return hit.pro;

  try {
    const res = await fetch(
      `https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(rcUserId)}`,
      { headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" } }
    );
    if (!res.ok) {
      logger.warn({ status: res.status }, "RevenueCat subscriber lookup failed");
      rcCache.set(rcUserId, { pro: false, exp: now + NEGATIVE_CACHE_TTL_MS });
      return false;
    }
    const data = (await res.json()) as any;
    const ent = data?.subscriber?.entitlements?.[PRO_ENTITLEMENT];
    const pro =
      !!ent && typeof ent.expires_date === "string" && new Date(ent.expires_date).getTime() > now;
    rcCache.set(rcUserId, { pro, exp: now + CACHE_TTL_MS });
    return pro;
  } catch (err) {
    logger.warn({ err }, "RevenueCat verification error");
    return false;
  }
}

export async function checkPro(
  deviceId?: string | null,
  rcUserId?: string | null
): Promise<{ pro: boolean; via?: "grant" | "revenuecat" }> {
  const cleanDevice = typeof deviceId === "string" && deviceId.trim() ? deviceId.trim() : null;
  const cleanRc = typeof rcUserId === "string" && rcUserId.trim() ? rcUserId.trim() : null;

  if (cleanDevice) {
    try {
      const [row] = await db
        .select({ deviceId: premiumAccessTable.deviceId })
        .from(premiumAccessTable)
        .where(eq(premiumAccessTable.deviceId, cleanDevice))
        .limit(1);
      if (row) return { pro: true, via: "grant" };
    } catch (err) {
      logger.warn({ err }, "premium_access lookup failed");
    }
  }

  if (cleanRc && (await verifyRevenueCat(cleanRc))) {
    return { pro: true, via: "revenuecat" };
  }

  return { pro: false };
}
