import { useQuery } from "@tanstack/react-query";
import { WeatherAlert } from "@/lib/weatherAlerts";

interface NWSFeature {
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

async function fetchNWSAlerts(lat: number, lon: number): Promise<WeatherAlert[]> {
  const res = await fetch(
    `https://api.weather.gov/alerts/active?point=${lat.toFixed(4)},${lon.toFixed(4)}&status=actual&message_type=alert`,
    { headers: { "User-Agent": "FITCheck/1.0 (style-sense-fitcheck.replit.app)" } }
  );
  if (!res.ok) return [];
  const data = await res.json();
  const features: NWSFeature[] = data.features ?? [];

  return features
    .filter(f => f.properties && new Date(f.properties.expires) > new Date())
    .slice(0, 3)
    .map(f => {
      const { id, event, severity, urgency, headline, description, instruction } = f.properties;
      const mappedSeverity = mapNWSSeverity(severity, urgency);
      const { color, bgColor } = nwsEventColors(mappedSeverity);
      const tip = instruction
        ? instruction.replace(/\n/g, " ").slice(0, 160)
        : "Follow official guidance and check local news for updates.";
      return {
        id: `nws-${id}`,
        severity: mappedSeverity,
        title: event,
        description: headline.replace(/\*\s*/g, "").trim().slice(0, 120),
        outfitTip: tip,
        icon: nwsEventIcon(event),
        color,
        bgColor,
      };
    });
}

export function useNWSAlerts(lat: number | null, lon: number | null) {
  return useQuery<WeatherAlert[]>({
    queryKey: ["nws-alerts", lat, lon],
    queryFn: () => fetchNWSAlerts(lat!, lon!),
    enabled: lat !== null && lon !== null,
    staleTime: 5 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
    refetchOnWindowFocus: true,
    retry: 1,
  });
}
