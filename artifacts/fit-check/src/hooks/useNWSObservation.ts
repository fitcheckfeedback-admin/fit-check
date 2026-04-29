import { useQuery } from "@tanstack/react-query";

export interface NWSObservation {
  tempF: number | null;
  feelsLikeF: number | null;
  weatherCode: number | null;
  textDescription: string;
  windMph: number | null;
  windGustsMph: number | null;
  humidity: number | null;
  precipLastHourMm: number | null;
  stationName: string;
  observedAt: string;
}

function cToF(c: number | null): number | null {
  return c == null ? null : Math.round(c * 9 / 5 + 32);
}
function msToMph(ms: number | null): number | null {
  return ms == null ? null : Math.round(ms * 2.237);
}

function descToWMOCode(desc: string): number {
  const d = desc.toLowerCase();
  if (d.includes("tornado"))                        return 99;
  if (d.includes("thunderstorm") || d.includes("thunder") || d.includes("t-storm")) return 95;
  if (d.includes("blizzard"))                       return 77;
  if (d.includes("heavy snow") || d.includes("heavy blowing snow")) return 75;
  if (d.includes("snow") || d.includes("sleet"))   return 71;
  if (d.includes("freezing rain") || d.includes("ice pellets")) return 67;
  if (d.includes("heavy rain") || d.includes("heavy drizzle")) return 65;
  if (d.includes("rain") || d.includes("shower"))  return 61;
  if (d.includes("drizzle"))                        return 51;
  if (d.includes("fog") || d.includes("mist"))     return 45;
  if (d.includes("overcast") || d.includes("cloudy")) return 3;
  if (d.includes("mostly cloudy") || d.includes("partly cloudy")) return 2;
  if (d.includes("clear") || d.includes("sunny") || d.includes("fair")) return 0;
  return -1; // unknown — keep Open-Meteo value
}

async function fetchNWSObservation(lat: number, lon: number): Promise<NWSObservation | null> {
  // Step 1: get the gridpoint and nearest station list URL
  const pointsRes = await fetch(
    `https://api.weather.gov/points/${lat.toFixed(4)},${lon.toFixed(4)}`,
    { headers: { "User-Agent": "FITCheck/1.0 (style-sense-fitcheck.replit.app)" } }
  );
  if (!pointsRes.ok) return null;
  const pointsData = await pointsRes.json();
  const stationsUrl: string | undefined = pointsData.properties?.observationStations;
  if (!stationsUrl) return null;

  // Step 2: get the list of nearby observation stations
  const stationsRes = await fetch(stationsUrl, {
    headers: { "User-Agent": "FITCheck/1.0 (style-sense-fitcheck.replit.app)" }
  });
  if (!stationsRes.ok) return null;
  const stationsData = await stationsRes.json();
  const stationId: string | undefined = stationsData.features?.[0]?.properties?.stationIdentifier;
  const stationName: string = stationsData.features?.[0]?.properties?.name ?? "Unknown";
  if (!stationId) return null;

  // Step 3: get the latest observation from the nearest station
  const obsRes = await fetch(
    `https://api.weather.gov/stations/${stationId}/observations/latest`,
    { headers: { "User-Agent": "FITCheck/1.0 (style-sense-fitcheck.replit.app)" } }
  );
  if (!obsRes.ok) return null;
  const obsData = await obsRes.json();
  const p = obsData.properties;
  if (!p) return null;

  const tempC: number | null = typeof p.temperature?.value === "number" ? p.temperature.value : null;
  const feelsLikeC: number | null = typeof p.heatIndex?.value === "number"
    ? p.heatIndex.value
    : typeof p.windChill?.value === "number" ? p.windChill.value : tempC;
  const windMs: number | null = typeof p.windSpeed?.value === "number" ? p.windSpeed.value : null;
  const gustMs: number | null = typeof p.windGust?.value === "number" ? p.windGust.value : null;
  const humidity: number | null = typeof p.relativeHumidity?.value === "number" ? p.relativeHumidity.value : null;
  const precipMm: number | null = typeof p.precipitationLastHour?.value === "number" ? p.precipitationLastHour.value : null;
  const textDescription: string = p.textDescription ?? "";
  const wmoCode = descToWMOCode(textDescription);

  return {
    tempF: cToF(tempC),
    feelsLikeF: cToF(feelsLikeC),
    weatherCode: wmoCode >= 0 ? wmoCode : null,
    textDescription,
    windMph: msToMph(windMs),
    windGustsMph: msToMph(gustMs),
    humidity,
    precipLastHourMm: precipMm,
    stationName,
    observedAt: p.timestamp ?? "",
  };
}

export function useNWSObservation(lat: number | null, lon: number | null) {
  return useQuery<NWSObservation | null>({
    queryKey: ["nws-observation", lat?.toFixed(3), lon?.toFixed(3)],
    queryFn: () => fetchNWSObservation(lat!, lon!),
    enabled: lat !== null && lon !== null,
    staleTime: 5 * 60 * 1000,
    refetchInterval: 8 * 60 * 1000,
    refetchOnWindowFocus: true,
    retry: 1,
  });
}
