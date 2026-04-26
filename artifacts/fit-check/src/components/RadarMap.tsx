import { useEffect, useRef, useState, useCallback } from "react";
import { Play, Pause, RefreshCw } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet bundler icon paths once
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Inject dark-map filter once
if (typeof document !== "undefined") {
  const id = "radar-dark-style";
  if (!document.getElementById(id)) {
    const s = document.createElement("style");
    s.id = id;
    s.textContent = `.radar-base-tile { filter: grayscale(1) invert(1) brightness(0.85) contrast(1.05); }`;
    document.head.appendChild(s);
  }
}

interface RadarFrame { time: number; path: string; }

interface RadarMapProps {
  lat: number;
  lon: number;
  temperatureF?: number;
  units?: "imperial" | "metric";
}

function formatTime(unix: number) {
  return new Date(unix * 1000).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function makeLocationIcon(temperatureF?: number, units?: "imperial" | "metric") {
  const show = temperatureF !== undefined;
  const temp = show
    ? units === "metric"
      ? `${Math.round((temperatureF! - 32) * 5 / 9)}°`
      : `${Math.round(temperatureF!)}°`
    : "";

  return L.divIcon({
    className: "",
    html: `
      <div style="display:flex;flex-direction:column;align-items:center;gap:3px;">
        <div style="
          background:#1c1c1e;
          color:#fff;
          font-size:13px;
          font-weight:800;
          padding:4px 10px;
          border-radius:999px;
          white-space:nowrap;
          box-shadow:0 2px 10px rgba(0,0,0,0.5);
          line-height:1.2;
        ">${show ? temp : "●"}</div>
        <div style="
          font-size:9px;
          font-weight:700;
          color:#1c1c1e;
          background:rgba(255,255,255,0.85);
          padding:1px 5px;
          border-radius:4px;
          letter-spacing:0.3px;
        ">My Location</div>
      </div>`,
    iconSize: [70, 46],
    iconAnchor: [35, 23],
  });
}

export function RadarMap({ lat, lon, temperatureF, units }: RadarMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const radarLayerRef = useRef<L.TileLayer | null>(null);
  const hostRef = useRef("https://tilecache.rainviewer.com");
  const animTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [frames, setFrames] = useState<RadarFrame[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [status, setStatus] = useState<"loading" | "error" | "ok">("loading");

  // Init map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      zoomControl: false,
      attributionControl: false,
      scrollWheelZoom: false,
    }).setView([lat, lon], 7);

    // OSM with dark CSS filter (reliable, CORS-safe)
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      subdomains: "abc",
      maxZoom: 19,
      crossOrigin: "anonymous",
      className: "radar-base-tile",
    } as any).addTo(map);

    // Temperature + "My Location" badge
    L.marker([lat, lon], { icon: makeLocationIcon(temperatureF, units) }).addTo(map);

    mapRef.current = map;

    return () => {
      if (animTimerRef.current) clearInterval(animTimerRef.current);
      map.remove();
      mapRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch radar frames
  const fetchFrames = useCallback(async () => {
    setStatus("loading");
    try {
      const res = await fetch("https://api.rainviewer.com/public/weather-maps.json");
      if (!res.ok) throw new Error();
      const data = await res.json();
      hostRef.current = data.host ?? "https://tilecache.rainviewer.com";
      const past: RadarFrame[] = data.radar?.past ?? [];
      const nowcast: RadarFrame[] = (data.radar?.nowcast ?? []).slice(0, 2);
      const all = [...past, ...nowcast];
      if (!all.length) throw new Error();
      setFrames(all);
      setActiveIdx(Math.max(0, past.length - 1));
      setStatus("ok");
    } catch {
      setStatus("error");
    }
  }, []);

  useEffect(() => { fetchFrames(); }, [fetchFrames]);

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
    const layer = L.tileLayer(url, { tileSize: 256, opacity: 0.75, zIndex: 10 });
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
    <div className="rounded-3xl overflow-hidden shadow-xl relative border border-border/20" style={{ background: "#1a1a1a" }}>
      {/* Map */}
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
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#1a1a1a]/90 z-40 gap-3">
          <p className="text-white/60 text-sm">Radar unavailable</p>
          <button onClick={fetchFrames} className="text-sm font-bold text-primary bg-primary/20 px-5 py-2 rounded-full">
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
              <button onClick={fetchFrames} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 border border-white/10">
                <RefreshCw className="w-3.5 h-3.5 text-white/80" />
              </button>
              <button onClick={() => setPlaying(p => !p)} className="w-8 h-8 flex items-center justify-center rounded-full bg-primary/80 border border-primary/30">
                {playing ? <Pause className="w-3.5 h-3.5 text-white" /> : <Play className="w-3.5 h-3.5 text-white ml-0.5" />}
              </button>
            </div>
          </div>

          {/* Scrubber */}
          <div className="flex items-center gap-0.5 mb-2.5">
            {frames.map((frame, idx) => (
              <button
                key={frame.time}
                onClick={() => { setActiveIdx(idx); setPlaying(false); }}
                className="flex-1 rounded-full transition-all duration-150"
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

          {/* Legend */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-white/40 mr-0.5">Rain:</span>
            {[["#40e0d0","Light"],["#00c400",""],["#ffff00","Mod"],["#ff8800",""],["#cc0000","Heavy"]].map(([c, label]) => (
              <div key={c} className="flex items-center gap-1">
                <div className="w-5 h-1.5 rounded-sm" style={{ background: c }} />
                {label && <span className="text-[9px] text-white/40">{label}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Attribution */}
      <div className="absolute top-2 right-3 z-30 text-[8px] text-white/25 pointer-events-none">
        © OpenStreetMap · RainViewer
      </div>
    </div>
  );
}
