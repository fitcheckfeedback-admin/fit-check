import { Router } from "express";

const router = Router();

// GET /api/location/detect — detect approximate city from client IP (no auth, no key needed)
router.get("/location/detect", async (req, res) => {
  try {
    const forwarded = req.headers["x-forwarded-for"];
    const raw = Array.isArray(forwarded) ? forwarded[0] : forwarded;
    const ip = raw?.split(",")[0].trim() || req.ip || "";

    // Strip IPv6 loopback / local addresses — fall back gracefully
    const isLocal =
      !ip || ip === "::1" || ip === "127.0.0.1" || ip.startsWith("192.168.") || ip.startsWith("10.");

    if (isLocal) {
      res.json({ detected: false });
      return;
    }

    // ip-api.com — free, 1000 req/min, no key needed (server-to-server HTTP is fine)
    const response = await fetch(
      `http://ip-api.com/json/${ip}?fields=status,city,regionName,lat,lon,countryCode`,
      { signal: AbortSignal.timeout(3000) }
    );

    if (!response.ok) {
      res.json({ detected: false });
      return;
    }

    const data = await response.json() as {
      status: string;
      city?: string;
      regionName?: string;
      lat?: number;
      lon?: number;
      countryCode?: string;
    };

    if (data.status === "success" && data.city && data.lat !== undefined && data.lon !== undefined) {
      res.json({
        detected: true,
        city: data.city,
        region: data.regionName ?? "",
        lat: data.lat,
        lon: data.lon,
        countryCode: data.countryCode ?? "",
      });
    } else {
      res.json({ detected: false });
    }
  } catch {
    res.json({ detected: false });
  }
});

export default router;
