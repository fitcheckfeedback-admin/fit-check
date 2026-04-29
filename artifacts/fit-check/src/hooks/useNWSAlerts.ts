import { useQuery } from "@tanstack/react-query";
import { WeatherAlert } from "@/lib/weatherAlerts";

const HDR = { headers: { "User-Agent": "FITCheck/1.0 (style-sense-fitcheck.replit.app)" } };

interface NWSRawFeature {
  properties: {
    id: string;
    event: string;
    severity: string;
    certainty: string;
    urgency: string;
    headline: string;
    description: string;
    instruction?: string;
    expires: string;
    areaDesc?: string;
  };
}

function mapNWSSeverity(severity: string, urgency: string): WeatherAlert["severity"] {
  if (severity === "Extreme" || severity === "Severe") return "warning";
  if (urgency === "Immediate" || urgency === "Expected") return "watch";
  return "advisory";
}

function nwsEventIcon(event: string): string {
  const e = event.toLowerCase();
  if (e.includes("thunder") || e.includes("lightning") || e.includes("tornado") || e.includes("severe")) return "Zap";
  if (e.includes("snow") || e.includes("blizzard") || e.includes("ice") || e.includes("freeze") || e.includes("frost")) return "Snowflake";
  if (e.includes("wind") || e.includes("gust")) return "Wind";
  if (e.includes("flood") || e.includes("rain") || e.includes("tropical") || e.includes("hurricane")) return "CloudRain";
  if (e.includes("heat") || e.includes("fire")) return "Thermometer";
  return "Zap";
}

function nwsEventColors(severity: WeatherAlert["severity"]): { color: string; bgColor: string } {
  if (severity === "warning") return { color: "text-red-600", bgColor: "bg-red-50 dark:bg-red-950/30" };
  if (severity === "watch") return { color: "text-orange-600", bgColor: "bg-orange-50 dark:bg-orange-950/30" };
  return { color: "text-yellow-600", bgColor: "bg-yellow-50 dark:bg-yellow-950/30" };
}

function featureToAlert(f: NWSRawFeature, nearby = false): WeatherAlert {
  const { id, event, severity, urgency, headline, description, instruction, areaDesc } = f.properties;
  const mappedSeverity = mapNWSSeverity(severity, urgency);
  const { color, bgColor } = nwsEventColors(mappedSeverity);
  const tip = instruction
    ? instruction.replace(/\n/g, " ").slice(0, 160)
    : description.replace(/\n/g, " ").slice(0, 160);
  const titlePrefix = nearby ? "Nearby area: " : "";
  const cleanHeadline = headline.replace(/\*\s*/g, "").trim().slice(0, 120);
  return {
    id: `nws-${id}`,
    severity: mappedSeverity,
    title: titlePrefix + event,
    description: nearby && areaDesc ? `${areaDesc.slice(0, 60)} — ${cleanHeadline}` : cleanHeadline,
    outfitTip: tip,
    icon: nwsEventIcon(event),
    color,
    bgColor,
  };
}

async function fetchNWSAlerts(lat: number, lon: number): Promise<WeatherAlert[]> {
  // Step 1: get county zone + CWA from /points
  let county = "";
  let cwa = "";
  try {
    const ptRes = await fetch(
      `https://api.weather.gov/points/${lat.toFixed(4)},${lon.toFixed(4)}`,
      HDR
    );
    if (ptRes.ok) {
      const ptData = await ptRes.json();
      // county is a URL like ".../zones/county/TXC085" — extract the last segment
      const countyUrl: string = ptData.properties?.county ?? "";
      county = countyUrl.split("/").pop() ?? "";
      cwa = ptData.properties?.cwa ?? "";
    }
  } catch {
    // non-US location or network error — fall through to point-only query
  }

  // Step 2: fire all three queries in parallel
  const urls: string[] = [
    `https://api.weather.gov/alerts/active?point=${lat.toFixed(4)},${lon.toFixed(4)}&status=actual&message_type=alert`,
  ];
  if (county) {
    urls.push(`https://api.weather.gov/alerts/active?zone=${county}&status=actual&message_type=alert`);
  }
  if (cwa) {
    // Broader WFO office query — catches moving storms not yet in the exact zone
    urls.push(`https://api.weather.gov/alerts/active?office=${cwa}&status=actual&message_type=alert`);
  }

  const results = await Promise.all(
    urls.map(url =>
      fetch(url, HDR)
        .then(r => (r.ok ? r.json() : { features: [] }))
        .catch(() => ({ features: [] }))
    )
  );

  const now = new Date();
  const seenIds = new Set<string>();
  const directIds = new Set<string>();
  const alerts: WeatherAlert[] = [];

  // First pass: point + county alerts are "direct" — always include if non-expired
  for (let i = 0; i < Math.min(2, results.length); i++) {
    const features: NWSRawFeature[] = results[i]?.features ?? [];
    for (const f of features) {
      const fid = f.properties?.id;
      if (!fid || seenIds.has(fid)) continue;
      if (!f.properties || new Date(f.properties.expires) <= now) continue;
      seenIds.add(fid);
      directIds.add(fid);
      alerts.push(featureToAlert(f, false));
    }
  }

  // Second pass: WFO office alerts — only Severe/Extreme/Immediate urgency, mark as nearby
  if (results.length >= 3) {
    const cwaFeatures: NWSRawFeature[] = results[2]?.features ?? [];
    for (const f of cwaFeatures) {
      const fid = f.properties?.id;
      if (!fid || seenIds.has(fid)) continue;
      if (!f.properties || new Date(f.properties.expires) <= now) continue;
      const { severity, urgency } = f.properties;
      // Only surface nearby alerts if they are genuinely dangerous
      if (severity !== "Extreme" && severity !== "Severe" && urgency !== "Immediate") continue;
      seenIds.add(fid);
      alerts.push(featureToAlert(f, true));
    }
  }

  // Sort: direct alerts first, then by severity (warning > watch > advisory)
  const order: Record<string, number> = { warning: 0, watch: 1, advisory: 2 };
  alerts.sort((a, b) => {
    const aDirect = directIds.has(a.id.replace("nws-", "")) ? 0 : 1;
    const bDirect = directIds.has(b.id.replace("nws-", "")) ? 0 : 1;
    if (aDirect !== bDirect) return aDirect - bDirect;
    return (order[a.severity] ?? 3) - (order[b.severity] ?? 3);
  });

  return alerts.slice(0, 5);
}

export function useNWSAlerts(lat: number | null, lon: number | null) {
  return useQuery<WeatherAlert[]>({
    queryKey: ["nws-alerts", lat?.toFixed(3), lon?.toFixed(3)],
    queryFn: () => fetchNWSAlerts(lat!, lon!),
    enabled: lat !== null && lon !== null,
    staleTime: 3 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    retry: 1,
  });
}
