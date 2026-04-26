import { useEffect, useRef, useState, useCallback } from "react";
import { Play, Pause, RefreshCw } from "lucide-react";
import "leaflet/dist/leaflet.css";

interface RadarFrame {
  time: number;
  path: string;
}

interface RainViewerData {
  radar: {
    past: RadarFrame[];
    nowcast: RadarFrame[];
  };
  satellite?: {
    infrared: RadarFrame[];
  };
}

interface RadarMapProps {
  lat: number;
  lon: number;
}

const TILE_SIZE = 512;
const COLOR_SCHEME = 8; // 8 = rainbow, 6 = blue-yellow-red
const SMOOTH = 1;
const SNOW = 1;

function formatFrameTime(unixTs: number): string {
  const d = new Date(unixTs * 1000);
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function RadarMap({ lat, lon }: RadarMapProps) {
  const mapRef = useRef<any>(null);
  const leafletRef = useRef<any>(null);
  const layersRef = useRef<Map<number, any>>(new Map());
  const animFrameRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [frames, setFrames] = useState<RadarFrame[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Fetch RainViewer data
  const fetchFrames = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch("https://api.rainviewer.com/public/weather-maps.json");
      if (!res.ok) throw new Error("RainViewer API error");
      const data: RainViewerData = await res.json();
      const past = data.radar?.past ?? [];
      const nowcast = (data.radar?.nowcast ?? []).slice(0, 2);
      const allFrames = [...past, ...nowcast];
      setFrames(allFrames);
      setActiveIdx(past.length - 1); // start on latest real observation
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initialize map
  useEffect(() => {
    let L: any;
    let map: any;

    async function init() {
      L = (await import("leaflet")).default;

      // Fix Leaflet's default icon paths broken by bundlers
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      if (mapRef.current) {
        map = L.map(mapRef.current, { zoomControl: false, attributionControl: true }).setView(
          [lat, lon],
          7
        );

        // Base tile layer — OSM
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "© OpenStreetMap contributors",
          opacity: 0.6,
        }).addTo(map);

        leafletRef.current = { L, map };
      }
    }

    init();

    return () => {
      if (leafletRef.current?.map) {
        leafletRef.current.map.remove();
        leafletRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch frames on mount
  useEffect(() => {
    fetchFrames();
  }, [fetchFrames]);

  // Add/remove radar tile layers when frames list changes
  useEffect(() => {
    if (!leafletRef.current || frames.length === 0) return;
    const { L, map } = leafletRef.current;

    // Remove old layers
    layersRef.current.forEach((layer) => map.removeLayer(layer));
    layersRef.current.clear();

    // Pre-create a layer per frame (hidden)
    frames.forEach((frame) => {
      const url = `https://tilecache.rainviewer.com${frame.path}/${TILE_SIZE}/{z}/{x}/{y}/${COLOR_SCHEME}/${SMOOTH}_${SNOW}.png`;
      const layer = L.tileLayer(url, {
        tileSize: TILE_SIZE,
        opacity: 0,
        zIndex: 10,
      });
      layer.addTo(map);
      layersRef.current.set(frame.time, layer);
    });
  }, [frames]);

  // Show active frame, hide others
  useEffect(() => {
    if (frames.length === 0) return;
    const activeTime = frames[activeIdx]?.time;
    layersRef.current.forEach((layer, time) => {
      layer.setOpacity(time === activeTime ? 0.7 : 0);
    });
  }, [activeIdx, frames]);

  // Auto-play animation
  useEffect(() => {
    if (!playing || frames.length === 0) {
      if (animFrameRef.current) clearInterval(animFrameRef.current);
      return;
    }
    animFrameRef.current = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % frames.length);
    }, 600);
    return () => {
      if (animFrameRef.current) clearInterval(animFrameRef.current);
    };
  }, [playing, frames.length]);

  return (
    <div className="relative rounded-2xl overflow-hidden border bg-card shadow-sm">
      {/* Map container */}
      <div ref={mapRef} className="w-full h-72" />

      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/80 rounded-2xl z-20">
          <RefreshCw className="w-6 h-6 animate-spin text-primary" />
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/90 rounded-2xl z-20 gap-2">
          <p className="text-sm text-muted-foreground">Radar unavailable</p>
          <button
            onClick={fetchFrames}
            className="text-xs font-semibold text-primary underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Controls overlay */}
      {!loading && !error && frames.length > 0 && (
        <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/60 to-transparent px-3 pb-3 pt-6">
          {/* Time label */}
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-white/90">
              {frames[activeIdx]
                ? formatFrameTime(frames[activeIdx].time)
                : ""}
              {activeIdx >= (frames.length - 2) ? (
                <span className="ml-1.5 text-[10px] bg-blue-500/80 text-white px-1.5 py-0.5 rounded-full">
                  FORECAST
                </span>
              ) : null}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={fetchFrames}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-sm"
              >
                <RefreshCw className="w-3.5 h-3.5 text-white" />
              </button>
              <button
                onClick={() => setPlaying((p) => !p)}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-sm"
              >
                {playing ? (
                  <Pause className="w-3.5 h-3.5 text-white" />
                ) : (
                  <Play className="w-3.5 h-3.5 text-white" />
                )}
              </button>
            </div>
          </div>

          {/* Scrubber */}
          <div className="flex items-center gap-1">
            {frames.map((frame, idx) => (
              <button
                key={frame.time}
                onClick={() => { setActiveIdx(idx); setPlaying(false); }}
                className="h-1 flex-1 rounded-full transition-all"
                style={{
                  background:
                    idx === activeIdx
                      ? "rgba(255,255,255,0.95)"
                      : idx < activeIdx
                      ? "rgba(255,255,255,0.45)"
                      : "rgba(255,255,255,0.2)",
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
