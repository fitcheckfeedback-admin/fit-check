import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { Play, Pause, RefreshCw, LocateFixed, Umbrella, CloudSun } from "lucide-react";
import L from "leaflet";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchForecast,
  type WeatherForecastResponse,
  type HourlyForecast,
} from "@/lib/weather";
import "leaflet/dist/leaflet.css";

// Fix Leaflet bundler icon paths once
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Basemap stays LIGHT in both app themes, like Apple Weather's precipitation
// map — no dark filter is ever applied.

interface RadarFrame { time: number; path: string; }

interface RadarMapProps {
  lat: number;
  lon: number;
  temperatureF?: number;
  units?: "imperial" | "metric";
  cityName?: string;
}

function formatTime(unix: number) {
  return new Date(unix * 1000).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/**
 * Apple Weather-style location badge: a round blue temperature circle with
 * the city name beneath it. The basemap is light in both app themes, so the
 * badge uses light-map styling (white ring, light city pill).
 */
function makeLocationIcon(temperatureF?: number, units?: "imperial" | "metric", cityName?: string) {
  const show = temperatureF !== undefined;
  const temp = show
    ? units === "metric"
      ? `${Math.round((temperatureF! - 32) * 5 / 9)}°`
      : `${Math.round(temperatureF!)}°`
    : "";
  const city = cityName ? escapeHtml(cityName) : "";

  return L.divIcon({
    className: "",
    html: `
      <div style="display:flex;flex-direction:column;align-items:center;gap:4px;">
        <div style="
          width:52px;height:52px;border-radius:9999px;
          background:linear-gradient(180deg,#2f9bff 0%,#0a6cff 100%);
          border:3px solid #ffffff;
          box-shadow:0 4px 14px rgba(10,108,255,0.45), 0 1px 3px rgba(0,0,0,0.30);
          display:flex;align-items:center;justify-content:center;
          color:#ffffff;font-size:17px;font-weight:800;line-height:1;
          font-family:-apple-system,BlinkMacSystemFont,'SF Pro Text',system-ui,sans-serif;
        ">${show ? temp : "●"}</div>
        ${city ? `<div style="
          font-size:11px;font-weight:700;color:#1c1c1e;
          background:rgba(255,255,255,0.92);
          padding:2px 8px;border-radius:6px;
          box-shadow:0 1px 4px rgba(0,0,0,0.20);
          white-space:nowrap;max-width:150px;overflow:hidden;text-overflow:ellipsis;
          font-family:-apple-system,BlinkMacSystemFont,'SF Pro Text',system-ui,sans-serif;
        ">${city}</div>` : ""}
      </div>`,
    iconSize: [120, 96],
    iconAnchor: [60, 48],
  });
}

/* ------------------------------------------------------------------ */
/* RainViewer payload: fetch with retry + defensive shape validation   */
/* ------------------------------------------------------------------ */

const RAINVIEWER_API = "https://api.rainviewer.com/public/weather-maps.json";
const RAINVIEWER_HOST_FALLBACK = "https://tilecache.rainviewer.com";

function isValidFrame(f: unknown): f is RadarFrame {
  if (typeof f !== "object" || f === null) return false;
  const o = f as Record<string, unknown>;
  return typeof o.time === "number" && typeof o.path === "string";
}

interface RadarPayload {
  host: string;
  frames: RadarFrame[];
  latestPastIdx: number;
}

/** Validate the RainViewer JSON defensively — throw on any unexpected shape. */
function parseRadarPayload(data: unknown): RadarPayload {
  if (typeof data !== "object" || data === null) throw new Error("bad payload");
  const d = data as Record<string, unknown>;
  const host =
    typeof d.host === "string" && d.host.length > 0 ? d.host : RAINVIEWER_HOST_FALLBACK;
  const radar = d.radar;
  if (typeof radar !== "object" || radar === null) throw new Error("missing radar");
  const r = radar as Record<string, unknown>;
  if (!Array.isArray(r.past) || !Array.isArray(r.nowcast)) throw new Error("missing frames");
  const past = (r.past as unknown[]).filter(isValidFrame);
  const nowcast = (r.nowcast as unknown[]).filter(isValidFrame).slice(0, 2);
  const frames = [...past, ...nowcast];
  if (frames.length === 0) throw new Error("no frames");
  return { host, frames, latestPastIdx: Math.max(0, past.length - 1) };
}

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** Fetch the RainViewer frame list, retrying up to 3 times with backoff. */
async function fetchRadarPayload(): Promise<RadarPayload> {
  let lastErr: unknown = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(RAINVIEWER_API);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return parseRadarPayload(await res.json());
    } catch (e) {
      lastErr = e;
      if (attempt < 2) await sleep(1000 * (attempt + 1)); // 1s, then 2s
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("radar fetch failed");
}

/* ------------------------------------------------------------------ */
/* Base-map tiles: bright Apple-style light basemap (light in both themes) */
/* Primary CARTO light_all (clean light-gray land, subtle boundaries,       */
/* readable city labels) -> fallback OSM standard (also light).            */
/* ------------------------------------------------------------------ */

const BASE_PRIMARY = "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
const BASE_FALLBACK = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const TILE_ERROR_THRESHOLD = 4;

/** Apple-style multi-state regional view */
const DEFAULT_ZOOM = 5;

/* ------------------------------------------------------------------ */
/* Precipitation verdict banner: derived from the hourly forecast      */
/* ------------------------------------------------------------------ */

/**
 * Read the parent page's cached forecast without triggering a new fetch.
 * Uses the same query key as useWeather(["weather", lat, lon]), enabled=false
 * so this component never owns a network request — it stays subscribed to
 * cache updates via the shared key.
 */
function useCachedWeather(lat: number, lon: number) {
  const queryClient = useQueryClient();
  const queryKey = ["weather", lat, lon];
  return useQuery<WeatherForecastResponse>({
    queryKey,
    queryFn: () => fetchForecast(lat, lon),
    enabled: false,
    staleTime: Infinity,
    initialData: () =>
      queryClient.getQueryData<WeatherForecastResponse>(queryKey) ?? undefined,
  });
}

function formatHour(hour: number) {
  const h = ((hour % 24) + 24) % 24;
  const ampm = h < 12 ? "AM" : "PM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12} ${ampm}`;
}

function daypart(hour: number) {
  if (hour < 5) return "overnight";
  if (hour < 12) return "this morning";
  if (hour < 17) return "this afternoon";
  if (hour < 21) return "this evening";
  return "tonight";
}

interface Verdict {
  text: string;
  rainy: boolean;
}

/**
 * Plain-language precipitation verdict from today's hourly
 * precipitation_probability: the max value and its hour.
 * Only upcoming hours of today are considered. Returns null when the
 * forecast data isn't available — the banner hides rather than guessing.
 */
function computeVerdict(hourly: HourlyForecast | undefined): Verdict | null {
  if (
    !hourly ||
    !Array.isArray(hourly.time) ||
    !Array.isArray(hourly.precipitation_probability)
  ) {
    return null;
  }
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const nowHour = now.getHours();

  let bestProb = -1;
  let bestHour = -1;
  for (let i = 0; i < hourly.time.length; i++) {
    const t = hourly.time[i];
    if (typeof t !== "string" || !t.startsWith(today)) continue;
    const hour = parseInt(t.slice(11, 13), 10);
    if (Number.isNaN(hour) || hour < nowHour) continue;
    const prob = hourly.precipitation_probability[i] ?? 0;
    if (prob > bestProb) {
      bestProb = prob;
      bestHour = hour;
    }
  }
  if (bestHour < 0) return null;

  const p = Math.round(bestProb);
  if (bestProb < 20) return { text: "No rain expected near you today", rainy: false };
  if (bestProb < 70)
    return { text: `${p}% chance of rain around ${formatHour(bestHour)}`, rainy: true };
  return {
    text: `Rain likely ${daypart(bestHour)} — ${p}% at ${formatHour(bestHour)}`,
    rainy: true,
  };
}

export function RadarMap({ lat, lon, temperatureF, units, cityName }: RadarMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const radarLayerRef = useRef<L.TileLayer | null>(null);
  const hostRef = useRef(RAINVIEWER_HOST_FALLBACK);
  const animTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tileErrorsRef = useRef(0);
  const baseFailedOverRef = useRef(false);

  const refreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [frames, setFrames] = useState<RadarFrame[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [status, setStatus] = useState<"loading" | "error" | "ok">("loading");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [attribution, setAttribution] = useState("© OpenStreetMap · © CARTO · RainViewer");

  // Forecast data for the verdict banner (passive cache read — no new fetch)
  const { data: weather } = useCachedWeather(lat, lon);
  const verdict = useMemo(() => computeVerdict(weather?.hourly), [weather]);

  // Init map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      zoomControl: false,
      attributionControl: false,
      scrollWheelZoom: false,
    }).setView([lat, lon], DEFAULT_ZOOM);

    // Bright Apple-style light basemap with failover to OSM (also light)
    const base = L.tileLayer(BASE_PRIMARY, {
      subdomains: "abcd",
      maxZoom: 19,
      crossOrigin: "anonymous",
    } as any);
    base.on("tileload", () => {
      tileErrorsRef.current = 0;
    });
    base.on("tileerror", () => {
      tileErrorsRef.current += 1;
      if (tileErrorsRef.current >= TILE_ERROR_THRESHOLD && !baseFailedOverRef.current) {
        baseFailedOverRef.current = true;
        const fallback = L.tileLayer(BASE_FALLBACK, {
          subdomains: "abc",
          maxZoom: 19,
          crossOrigin: "anonymous",
        } as any);
        map.addLayer(fallback);
        map.removeLayer(base);
        setAttribution("© OpenStreetMap contributors · RainViewer");
      }
    });
    base.addTo(map);

    // Apple-style round blue temperature badge + city name
    L.marker([lat, lon], { icon: makeLocationIcon(temperatureF, units, cityName) }).addTo(map);

    mapRef.current = map;

    return () => {
      if (animTimerRef.current) clearInterval(animTimerRef.current);
      map.remove();
      mapRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch radar frames (with retry + validation)
  const fetchFrames = useCallback(async (silent = false) => {
    if (!silent) setStatus("loading");
    try {
      const { host, frames: all, latestPastIdx } = await fetchRadarPayload();
      hostRef.current = host;
      setFrames(all);
      setActiveIdx(latestPastIdx);
      setLastUpdated(new Date());
      setStatus("ok");
    } catch {
      // Silent background refreshes never clobber a working map
      if (!silent) setStatus("error");
    }
  }, []);

  // Initial fetch
  useEffect(() => { fetchFrames(); }, [fetchFrames]);

  // Auto-refresh every 30 seconds (silent — no loading spinner)
  useEffect(() => {
    if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
    refreshTimerRef.current = setInterval(() => { fetchFrames(true); }, 30_000);
    return () => { if (refreshTimerRef.current) clearInterval(refreshTimerRef.current); };
  }, [fetchFrames]);

  // Recenter on the user's location (same source the map was built from)
  const recenter = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    map.setView([lat, lon], Math.max(map.getZoom(), DEFAULT_ZOOM), { animate: true });
  }, [lat, lon]);

  // Render a specific radar frame
  const showFrame = useCallback((idx: number, frameList: RadarFrame[]) => {
    if (!mapRef.current || !frameList.length) return;
    const frame = frameList[idx];
    if (!frame) return;

    if (radarLayerRef.current) {
      mapRef.current.removeLayer(radarLayerRef.current);
      radarLayerRef.current = null;
    }

    const url = `${hostRef.current}${frame.path}/256/{z}/{x}/{y}/8/1_1.png`;
    const layer = L.tileLayer(url, { tileSize: 256, opacity: 0.8, zIndex: 10, maxNativeZoom: 12, maxZoom: 18 });
    layer.addTo(mapRef.current);
    radarLayerRef.current = layer;
  }, []);

  useEffect(() => {
    if (frames.length) showFrame(activeIdx, frames);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frames]);

  useEffect(() => {
    if (frames.length) showFrame(activeIdx, frames);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIdx]);

  // Auto-play
  useEffect(() => {
    if (animTimerRef.current) clearInterval(animTimerRef.current);
    if (!playing || !frames.length) return;
    animTimerRef.current = setInterval(() => {
      setActiveIdx(prev => {
        const next = (prev + 1) % frames.length;
        showFrame(next, frames);
        return next;
      });
    }, 700);
    return () => { if (animTimerRef.current) clearInterval(animTimerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, frames]);

  const isForecast = activeIdx >= frames.length - 2;

  return (
    <>
    <div className="rounded-3xl overflow-hidden shadow-xl relative border border-border/20" style={{ background: "#1a1a1a" }}>
      {/* Precipitation verdict banner — from today's hourly forecast */}
      {verdict && (
        <div className="px-4 pt-3 pb-2.5 flex items-center gap-3">
          <div
            className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center ${
              verdict.rainy ? "bg-sky-500/20" : "bg-emerald-500/15"
            }`}
          >
            {verdict.rainy
              ? <Umbrella className="w-5 h-5 text-sky-400" />
              : <CloudSun className="w-5 h-5 text-emerald-400" />}
          </div>
          <div className="min-w-0">
            <p className="text-white font-bold text-sm leading-tight">{verdict.text}</p>
            <p className="text-white/40 text-[10px] mt-0.5">from today&apos;s forecast</p>
          </div>
        </div>
      )}

      {/* Map */}
      <div className="relative">
        <div ref={containerRef} style={{ height: 340, width: "100%" }} />

        {/* Loading */}
        {status === "loading" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#1a1a1a]/90 z-40 gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-primary" />
            <span className="text-sm text-white/60 font-medium">Loading radar…</span>
          </div>
        )}

        {/* Error */}
        {status === "error" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#1a1a1a]/90 z-40 gap-3 px-6 text-center">
            <p className="text-white/60 text-sm">Radar unavailable — could not load the latest frames</p>
            <button
              onClick={() => fetchFrames()}
              className="text-sm font-bold text-primary bg-primary/20 px-5 py-2.5 rounded-full min-h-[44px]"
            >
              Retry
            </button>
          </div>
        )}

        {/* Controls */}
        {status === "ok" && frames.length > 0 && (
          <div className="absolute bottom-0 left-0 right-0 z-30 px-4 pb-4 pt-14 bg-gradient-to-t from-black/80 via-black/30 to-transparent">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <span className="text-white font-bold text-sm tabular-nums">
                  {frames[activeIdx] ? formatTime(frames[activeIdx].time) : ""}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isForecast ? "bg-blue-500/80 text-white" : "bg-white/15 text-white/70"}`}>
                  {isForecast ? "FORECAST" : "OBSERVED"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => fetchFrames()}
                  aria-label="Refresh radar"
                  className="w-11 h-11 flex items-center justify-center rounded-full bg-white/10 border border-white/10"
                >
                  <RefreshCw className="w-5 h-5 text-white/80" />
                </button>
                <button
                  onClick={() => setPlaying(p => !p)}
                  aria-label={playing ? "Pause animation" : "Play animation"}
                  className="w-11 h-11 flex items-center justify-center rounded-full bg-primary/80 border border-primary/30"
                >
                  {playing ? <Pause className="w-5 h-5 text-white" /> : <Play className="w-5 h-5 text-white ml-0.5" />}
                </button>
              </div>
            </div>

            {/* Scrubber */}
            <div className="flex items-center gap-0.5 mb-2.5">
              {frames.map((frame, idx) => (
                <button
                  key={frame.time}
                  onClick={() => { setActiveIdx(idx); setPlaying(false); }}
                  aria-label={`Show frame ${formatTime(frame.time)}`}
                  className="flex-1 rounded-full transition-all duration-150 min-h-[24px]"
                  style={{
                    height: idx === activeIdx ? 6 : 4,
                    background: idx === activeIdx
                      ? "#f97316"
                      : idx < activeIdx
                      ? (idx >= frames.length - 2 ? "rgba(96,165,250,0.55)" : "rgba(255,255,255,0.45)")
                      : (idx >= frames.length - 2 ? "rgba(96,165,250,0.2)" : "rgba(255,255,255,0.15)"),
                  }}
                />
              ))}
            </div>

            {/* Last updated */}
            {lastUpdated && (
              <p className="text-[9px] text-white/35 text-center mt-1.5">
                Updated {lastUpdated.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} · auto-refreshes every 30s
              </p>
            )}
          </div>
        )}

        {/* Zoom + recenter controls */}
        <div className="absolute top-3 left-3 z-30 flex flex-col gap-1.5">
          <button
            onClick={() => mapRef.current?.zoomIn()}
            aria-label="Zoom in"
            className="w-11 h-11 flex items-center justify-center rounded-xl bg-black/50 backdrop-blur-sm border border-white/10 text-white text-xl font-bold leading-none"
          >+</button>
          <button
            onClick={() => mapRef.current?.zoomOut()}
            aria-label="Zoom out"
            className="w-11 h-11 flex items-center justify-center rounded-xl bg-black/50 backdrop-blur-sm border border-white/10 text-white text-xl font-bold leading-none"
          >−</button>
          <button
            onClick={recenter}
            aria-label="Recenter on my location"
            className="w-11 h-11 flex items-center justify-center rounded-xl bg-black/50 backdrop-blur-sm border border-white/10"
          >
            <LocateFixed className="w-5 h-5 text-white/90" />
          </button>
        </div>

        {/* Attribution */}
        <div className="absolute top-2 right-3 z-30 text-[8px] text-white/25 pointer-events-none">
          {attribution}
        </div>
      </div>
    </div>

    {/* Legend card — Apple-style continuous gradient bar */}
    <div className="bg-card border border-border/40 rounded-2xl px-4 py-3 mt-3">
      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Precipitation Intensity</p>
      <div
        className="w-full h-3 rounded-full"
        style={{
          background: "linear-gradient(90deg,#38bdf8 0%,#818cf8 30%,#facc15 55%,#fb923c 78%,#ef4444 100%)",
        }}
        role="img"
        aria-label="Precipitation intensity legend: light to heavy"
      />
      <div className="flex items-center justify-between mt-1.5">
        <span className="text-[10px] text-muted-foreground font-semibold">Light</span>
        <span className="text-[10px] text-muted-foreground font-semibold">Moderate</span>
        <span className="text-[10px] text-muted-foreground font-semibold">Heavy</span>
      </div>
    </div>
    </>
  );
}
