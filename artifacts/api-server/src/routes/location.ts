import { Router } from "express";
import { logger } from "../lib/logger";

const router = Router();

function extractClientIp(req: Parameters<typeof router.get>[1] extends (req: infer R, ...args: any[]) => any ? R : never): string {
  // Try headers in priority order
  const headers = [
    "cf-connecting-ip",       // Cloudflare (Replit uses CF in prod)
    "x-real-ip",              // nginx / other proxies
    "x-forwarded-for",        // standard proxy chain
    "x-client-ip",
  ];

  for (const h of headers) {
    const val = req.headers[h];
    const raw = Array.isArray(val) ? val[0] : val;
    if (raw) {
      const ip = raw.split(",")[0].trim();
      if (ip) return ip;
    }
  }

  return req.ip ?? "";
}

function isPrivate(ip: string): boolean {
  return (
    !ip ||
    ip === "::1" ||
    ip === "127.0.0.1" ||
    ip.startsWith("192.168.") ||
    ip.startsWith("10.") ||
    ip.startsWith("172.16.") ||
    ip.startsWith("172.17.") ||
    ip.startsWith("172.18.") ||
    ip.startsWith("172.19.") ||
    ip.startsWith("172.2") ||
    ip.startsWith("172.30.") ||
    ip.startsWith("172.31.") ||
    ip === "::ffff:127.0.0.1"
  );
}

// GET /api/location/detect — detect approximate city from client IP (no auth needed)
router.get("/location/detect", async (req, res) => {
  const ip = extractClientIp(req as any);

  logger.info({ ip }, "location/detect called");

  if (isPrivate(ip)) {
    logger.info({ ip }, "Private/local IP, skipping detection");
    res.json({ detected: false });
    return;
  }

  // Primary: ip-api.com — free, 1000 req/min, HTTP only
  try {
    const response = await fetch(
      `http://ip-api.com/json/${ip}?fields=status,city,regionName,lat,lon,countryCode`,
      { signal: AbortSignal.timeout(3000) }
    );

    if (response.ok) {
      const data = await response.json() as {
        status: string;
        city?: string;
        regionName?: string;
        lat?: number;
        lon?: number;
        countryCode?: string;
      };

      if (data.status === "success" && data.city && data.lat !== undefined && data.lon !== undefined) {
        logger.info({ ip, city: data.city }, "ip-api.com detected location");
        res.json({
          detected: true,
          city: data.city,
          region: data.regionName ?? "",
          lat: data.lat,
          lon: data.lon,
          countryCode: data.countryCode ?? "",
        });
        return;
      }
      logger.info({ ip, status: data.status }, "ip-api.com returned non-success");
    }
  } catch (err) {
    logger.warn({ ip, err }, "ip-api.com request failed, trying fallback");
  }

  // Fallback: ipapi.co — free HTTPS tier, 1000 req/day
  try {
    const response = await fetch(
      `https://ipapi.co/${ip}/json/`,
      { signal: AbortSignal.timeout(4000) }
    );

    if (response.ok) {
      const data = await response.json() as {
        error?: boolean;
        city?: string;
        region?: string;
        latitude?: number;
        longitude?: number;
        country_code?: string;
      };

      if (!data.error && data.city && data.latitude !== undefined && data.longitude !== undefined) {
        logger.info({ ip, city: data.city }, "ipapi.co detected location");
        res.json({
          detected: true,
          city: data.city,
          region: data.region ?? "",
          lat: data.latitude,
          lon: data.longitude,
          countryCode: data.country_code ?? "",
        });
        return;
      }
      logger.info({ ip }, "ipapi.co returned no usable data");
    }
  } catch (err) {
    logger.warn({ ip, err }, "ipapi.co request also failed");
  }

  res.json({ detected: false });
});

export default router;
