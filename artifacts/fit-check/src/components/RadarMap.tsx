import { useEffect, useRef, useState, useCallback } from "react";
import { Play, Pause, RefreshCw } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet icon paths broken by bundlers (do this once)
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface RadarFrame { time: number; path: string; }

interface RadarMapProps { lat: number; lon: number; }

function formatTime(unix: number) {
  return new Date(unix * 1000).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function RadarMap({ lat, lon }: RadarMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const radarLayerRef = useRef<L.TileLayer | null>(null);
  const hostRef = useRef("https://tilecache.rainviewer.com");
  const animTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [frames, setFrames] = useState<RadarFrame[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [status, setStatus] = useState<"loading" | "error" | "ok">("loading");

  // --- Init map ---
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      zoomControl: false,
      attributionControl: false,
      scrollWheelZoom: false,
    }).setView([lat, lon], 7);

    // OpenStreetMap base — most reliable, no CORS issues
    L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      { subdomains: "abc", maxZoom: 19, crossOrigin: "anonymous" }
    ).addTo(map);

    // User location dot
    L.circleMarker([lat, lon], {
      radius: 7,
      color: "#fff",
      fillColor: "#f97316",
      fillOpacity: 1,
      weight: 2.5,
    }).addTo(map);

    mapRef.current = map;

    return () => {
      if (animTimerRef.current) clearInterval(animTimerRef.current);
      map.remove();
      mapRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Fetch radar frames ---
  const fetchFrames = useCallback(async () => {
    setStatus("loading");
    try {
      const res = await fetch("https://api.rainviewer.com/public/weather-maps.json");
      if (!res.ok) throw new Error("bad response");
      const data = await res.json();
      hostRef.current = data.host ?? "https://tilecache.rainviewer.com";
      const past: RadarFrame[] = data.radar?.past ?? [];
      const nowcast: RadarFrame[] = (data.radar?.nowcast ?? []).slice(0, 2);
      const all = [...past, ...nowcast];
      if (all.length === 0) throw new Error("no frames");
      setFrames(all);
      setActiveIdx(Math.max(0, past.length - 1));
      setStatus("ok");
    } catch {
      setStatus("error");
    }
  }, []);

  useEffect(() => { fetchFrames(); }, [fetchFrames]);

  // --- Show a specific frame on the map ---
  const showFrame = useCallback((idx: number, frameList: RadarFrame[]) => {
    if (!mapRef.current || frameList.length === 0) return;
    const frame = frameList[idx];
    if (!frame) return;

    if (radarLayerRef.current) {
      mapRef.current.removeLayer(radarLayerRef.current);
      radarLayerRef.current = null;
    }

    const url = `${hostRef.current}${frame.path}/512/{z}/{x}/{y}/6/1_1.png`;
    const layer = L.tileLayer(url, { tileSize: 512, opacity: 0.7, zIndex: 10, crossOrigin: "anonymous" });
    layer.addTo(mapRef.current);
    radarLayerRef.current = layer;
  }, []);

  // When frames first load, show latest observed frame
  useEffect(() => {
    if (frames.length > 0) showFrame(activeIdx, frames);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frames]);

  // When user scrubs, show that frame
  useEffect(() => {
    if (frames.length > 0) showFrame(activeIdx, frames);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIdx]);

  // Auto-play
  useEffect(() => {
    if (animTimerRef.current) clearInterval(animTimerRef.current);
    if (!playing || frames.length === 0) return;

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

  const isForecastFrame = activeIdx >= frames.length - 2;

  return (
    <div className="rounded-3xl overflow-hidden shadow-xl relative border border-border/40" style={{ background: "#e8e8e8" }}>
      {/* Map canvas */}
      <div ref={containerRef} style={{ height: 340, width: "100%" }} />

      {/* Attribution */}
      <div className="absolute bottom-16 right-2 z-30 text-[8px] text-black/30 pointer-events-none">
        © OpenStreetMap · RainViewer
      </div>

      {/* Loading */}
      {status === "loading" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 z-40 gap-3">
          <RefreshCw className="w-6 h-6 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Loading radar…</span>
        </div>
      )}

      {/* Error */}
      {status === "error" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/90 z-40 gap-3">
          <p className="text-muted-foreground text-sm">Radar data unavailable</p>
          <button onClick={fetchFrames} className="text-sm font-bold text-primary bg-primary/20 px-5 py-2 rounded-full">
            Retry
          </button>
        </div>
      )}

      {/* Controls */}
      {status === "ok" && frames.length > 0 && (
        <div className="absolute bottom-0 left-0 right-0 z-30 px-4 pb-4 pt-12 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
          {/* Row: time badge + buttons */}
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <span className="text-white font-bold text-sm tabular-nums">
                {frames[activeIdx] ? formatTime(frames[activeIdx].time) : ""}
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                isForecastFrame
                  ? "bg-blue-500/80 text-white"
                  : "bg-white/15 text-white/70"
              }`}>
                {isForecastFrame ? "FORECAST" : "OBSERVED"}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={fetchFrames}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 border border-white/10 backdrop-blur-sm"
              >
                <RefreshCw className="w-3.5 h-3.5 text-white/80" />
              </button>
              <button
                onClick={() => setPlaying(p => !p)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-primary/80 border border-primary/30 backdrop-blur-sm"
              >
                {playing
                  ? <Pause className="w-3.5 h-3.5 text-white" />
                  : <Play className="w-3.5 h-3.5 text-white ml-0.5" />}
              </button>
            </div>
          </div>

          {/* Timeline scrubber */}
          <div className="flex items-center gap-0.5">
            {frames.map((frame, idx) => {
              const isFc = idx >= frames.length - 2;
              return (
                <button
                  key={frame.time}
                  onClick={() => { setActiveIdx(idx); setPlaying(false); }}
                  className="flex-1 rounded-full transition-all duration-150"
                  style={{
                    height: idx === activeIdx ? 6 : 4,
                    background:
                      idx === activeIdx
                        ? "#f97316"
                        : idx < activeIdx
                        ? isFc ? "rgba(96,165,250,0.55)" : "rgba(255,255,255,0.45)"
                        : isFc ? "rgba(96,165,250,0.2)" : "rgba(255,255,255,0.15)",
                  }}
                />
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-1.5 mt-2.5">
            <span className="text-[10px] text-white/40 mr-1">Rain</span>
            {[
              { color: "#00eaff", label: "Light" },
              { color: "#00c400", label: "" },
              { color: "#ffff00", label: "Mod" },
              { color: "#ff8800", label: "" },
              { color: "#ff0000", label: "Heavy" },
            ].map(({ color, label }) => (
              <div key={color} className="flex items-center gap-1">
                <div className="w-5 h-1.5 rounded-sm" style={{ background: color }} />
                {label && <span className="text-[9px] text-white/40">{label}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
