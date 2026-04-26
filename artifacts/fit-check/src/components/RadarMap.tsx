import { useEffect, useRef, useState, useCallback } from "react";
import { Play, Pause, RefreshCw } from "lucide-react";
import "leaflet/dist/leaflet.css";

interface RadarFrame {
  time: number;
  path: string;
}

interface RadarMapProps {
  lat: number;
  lon: number;
}

function formatTime(unixTs: number): string {
  return new Date(unixTs * 1000).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function RadarMap({ lat, lon }: RadarMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<{
    L: any;
    map: any;
    radarLayer: any | null;
    animTimer: ReturnType<typeof setInterval> | null;
    host: string;
    frames: RadarFrame[];
    currentIdx: number;
    playing: boolean;
  }>({
    L: null,
    map: null,
    radarLayer: null,
    animTimer: null,
    host: "https://tilecache.rainviewer.com",
    frames: [],
    currentIdx: 0,
    playing: true,
  });

  const [frames, setFrames] = useState<RadarFrame[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [status, setStatus] = useState<"loading" | "error" | "ok">("loading");

  // Keep stateRef in sync with react state
  useEffect(() => { stateRef.current.frames = frames; }, [frames]);
  useEffect(() => { stateRef.current.currentIdx = activeIdx; }, [activeIdx]);
  useEffect(() => { stateRef.current.playing = playing; }, [playing]);

  // Fetch radar frames from RainViewer
  const fetchFrames = useCallback(async () => {
    setStatus("loading");
    try {
      const res = await fetch("https://api.rainviewer.com/public/weather-maps.json");
      if (!res.ok) throw new Error();
      const data = await res.json();
      stateRef.current.host = data.host ?? "https://tilecache.rainviewer.com";
      const past: RadarFrame[] = data.radar?.past ?? [];
      const nowcast: RadarFrame[] = (data.radar?.nowcast ?? []).slice(0, 2);
      const all = [...past, ...nowcast];
      setFrames(all);
      setActiveIdx(Math.max(0, past.length - 1));
      setStatus("ok");
    } catch {
      setStatus("error");
    }
  }, []);

  // Init map once
  useEffect(() => {
    if (!containerRef.current) return;
    let destroyed = false;

    (async () => {
      const L = (await import("leaflet")).default;
      if (destroyed || !containerRef.current) return;

      // Fix broken Leaflet icon paths in bundlers
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const map = L.map(containerRef.current, {
        zoomControl: false,
        attributionControl: false,
        scrollWheelZoom: false,
        dragging: true,
        touchZoom: true,
      }).setView([lat, lon], 7);

      // Clean grey base map — radar colors pop on this
      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/dark_matter_no_labels/{z}/{x}/{y}{r}.png",
        { subdomains: "abcd", maxZoom: 20 }
      ).addTo(map);

      // Subtle city labels on top
      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/dark_matter_only_labels/{z}/{x}/{y}{r}.png",
        { subdomains: "abcd", maxZoom: 20, zIndex: 20, opacity: 0.6 }
      ).addTo(map);

      // Location marker
      L.circleMarker([lat, lon], {
        radius: 7,
        color: "#fff",
        fillColor: "#f97316",
        fillOpacity: 1,
        weight: 2.5,
        zIndex: 30,
      }).addTo(map);

      stateRef.current.L = L;
      stateRef.current.map = map;
    })();

    return () => {
      destroyed = true;
      if (stateRef.current.animTimer) clearInterval(stateRef.current.animTimer);
      stateRef.current.map?.remove();
      stateRef.current.map = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch on mount
  useEffect(() => { fetchFrames(); }, [fetchFrames]);

  // Show the active radar frame on the map
  const showFrame = useCallback((idx: number, frameList: RadarFrame[]) => {
    const { L, map, host } = stateRef.current;
    if (!L || !map || frameList.length === 0) return;

    const frame = frameList[idx];
    if (!frame) return;

    // Remove previous radar layer
    if (stateRef.current.radarLayer) {
      map.removeLayer(stateRef.current.radarLayer);
      stateRef.current.radarLayer = null;
    }

    const url = `${host}${frame.path}/512/{z}/{x}/{y}/6/1_1.png`;
    const layer = L.tileLayer(url, {
      tileSize: 512,
      opacity: 0.65,
      zIndex: 10,
    });
    layer.addTo(map);
    stateRef.current.radarLayer = layer;
  }, []);

  // When frames load, show the latest frame
  useEffect(() => {
    if (frames.length > 0) {
      showFrame(activeIdx, frames);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frames]);

  // Update map when activeIdx changes
  useEffect(() => {
    if (frames.length > 0) {
      showFrame(activeIdx, frames);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIdx]);

  // Auto-play
  useEffect(() => {
    if (stateRef.current.animTimer) clearInterval(stateRef.current.animTimer);
    if (!playing || frames.length === 0) return;

    stateRef.current.animTimer = setInterval(() => {
      setActiveIdx(prev => {
        const next = (prev + 1) % frames.length;
        showFrame(next, frames);
        return next;
      });
    }, 700);

    return () => {
      if (stateRef.current.animTimer) clearInterval(stateRef.current.animTimer);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, frames]);

  const isPast = activeIdx < frames.length - 2;

  return (
    <div className="rounded-3xl overflow-hidden border border-border/30 shadow-lg relative" style={{ background: "#1a1a2e" }}>
      {/* Map */}
      <div ref={containerRef} className="w-full" style={{ height: 320 }} />

      {/* Loading state */}
      {status === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-30 rounded-3xl">
          <div className="flex flex-col items-center gap-3">
            <RefreshCw className="w-7 h-7 animate-spin text-primary" />
            <span className="text-white/80 text-sm font-medium">Loading radar…</span>
          </div>
        </div>
      )}

      {/* Error state */}
      {status === "error" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 z-30 rounded-3xl gap-3">
          <p className="text-white/80 text-sm">Radar unavailable</p>
          <button
            onClick={fetchFrames}
            className="text-xs font-bold text-primary bg-primary/20 px-4 py-2 rounded-full"
          >
            Retry
          </button>
        </div>
      )}

      {/* Controls overlay */}
      {status === "ok" && frames.length > 0 && (
        <div className="absolute bottom-0 left-0 right-0 z-20 px-4 pb-4 pt-10 bg-gradient-to-t from-black/75 via-black/30 to-transparent">
          {/* Top row: time + badge + buttons */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-white font-bold text-sm tabular-nums">
                {frames[activeIdx] ? formatTime(frames[activeIdx].time) : ""}
              </span>
              {!isPast && (
                <span className="text-[10px] font-black bg-blue-500 text-white px-2 py-0.5 rounded-full tracking-wide">
                  FORECAST
                </span>
              )}
              {isPast && (
                <span className="text-[10px] font-semibold text-white/60 bg-white/10 px-2 py-0.5 rounded-full">
                  OBSERVED
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={fetchFrames}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/15 backdrop-blur-sm border border-white/10"
              >
                <RefreshCw className="w-3.5 h-3.5 text-white" />
              </button>
              <button
                onClick={() => setPlaying(p => !p)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/15 backdrop-blur-sm border border-white/10"
              >
                {playing
                  ? <Pause className="w-3.5 h-3.5 text-white" />
                  : <Play className="w-3.5 h-3.5 text-white ml-0.5" />}
              </button>
            </div>
          </div>

          {/* Scrubber */}
          <div className="flex items-center gap-1">
            {frames.map((frame, idx) => {
              const isForecast = idx >= frames.length - 2;
              return (
                <button
                  key={frame.time}
                  onClick={() => { setActiveIdx(idx); setPlaying(false); }}
                  className="flex-1 h-1.5 rounded-full transition-all duration-200"
                  style={{
                    background: idx === activeIdx
                      ? "#f97316"
                      : idx < activeIdx
                      ? isForecast ? "rgba(96,165,250,0.6)" : "rgba(255,255,255,0.5)"
                      : isForecast ? "rgba(96,165,250,0.25)" : "rgba(255,255,255,0.2)",
                  }}
                />
              );
            })}
          </div>

          {/* Color legend */}
          <div className="flex items-center justify-center gap-1 mt-3">
            {["#00d4ff","#00ff9d","#ffff00","#ff8c00","#ff0000"].map((c, i) => (
              <div key={i} className="flex flex-col items-center gap-0.5">
                <div className="w-6 h-2 rounded-sm" style={{ background: c }} />
              </div>
            ))}
            <span className="text-[10px] text-white/50 ml-1">Light → Heavy</span>
          </div>
        </div>
      )}
    </div>
  );
}
