import { useState } from "react";

const FILTERS = [
  { name: "Normal", style: {} },
  { name: "Warm", style: { filter: "sepia(0.35) saturate(1.4) brightness(1.05)" } },
  { name: "Vivid", style: { filter: "saturate(1.8) contrast(1.1)" } },
  { name: "Faded", style: { filter: "contrast(0.85) brightness(1.1) saturate(0.7)" } },
  { name: "Cool", style: { filter: "hue-rotate(20deg) saturate(1.2) brightness(0.97)" } },
  { name: "B&W", style: { filter: "grayscale(1) contrast(1.1)" } },
  { name: "Golden", style: { filter: "sepia(0.6) saturate(1.6) brightness(1.1)" } },
];

const MUSIC_TRACKS = ["No music", "Morning Vibes", "Chill Day", "City Pulse", "Soft Focus"];

export function FitCheckCam() {
  const [activeFilter, setActiveFilter] = useState(0);
  const [activeMusic, setActiveMusic] = useState(0);
  const [showMusicPicker, setShowMusicPicker] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recorded, setRecorded] = useState(false);
  const [timer, setTimer] = useState(0);

  const handleRecord = () => {
    if (recorded) { setRecorded(false); setTimer(0); return; }
    if (recording) { setRecording(false); setRecorded(true); return; }
    setRecording(true);
    let t = 0;
    const interval = setInterval(() => {
      t++;
      setTimer(t);
      if (t >= 60) { clearInterval(interval); setRecording(false); setRecorded(true); }
    }, 1000);
  };

  const filterStyle = FILTERS[activeFilter].style;

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden select-none font-sans">

      {/* Simulated camera viewfinder */}
      <div
        className="absolute inset-0 transition-all duration-300"
        style={{
          background: "linear-gradient(160deg, #1a1a2e 0%, #16213e 40%, #0f3460 70%, #1a1a2e 100%)",
          ...filterStyle,
        }}
      >
        {/* Fake clothing/mirror reflection blobs */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-48 h-64 rounded-full bg-amber-300/30 blur-3xl" />
          <div className="absolute bottom-1/3 right-1/4 w-32 h-48 rounded-full bg-blue-300/20 blur-2xl" />
          <div className="absolute top-1/2 left-1/4 w-20 h-32 rounded-full bg-white/10 blur-xl" />
        </div>
        {/* Subtle grid overlay for "camera" feel */}
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)", backgroundSize: "33.33% 33.33%" }}
        />
      </div>

      {/* Recording border pulse */}
      {recording && (
        <div className="absolute inset-0 rounded-none border-4 border-red-500 animate-pulse pointer-events-none z-30" />
      )}

      {/* Top bar — branding + weather chip */}
      <div className="absolute top-0 left-0 right-0 z-20 px-4 pt-10 pb-4 bg-gradient-to-b from-black/60 to-transparent">
        <div className="flex items-start justify-between">
          {/* Fit Check logo + label */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow">
              <span className="text-[#FF9500] font-black text-sm">F</span>
            </div>
            <div>
              <p className="text-white font-black text-sm leading-none tracking-tight">Fit Check</p>
              <p className="text-white/60 text-[9px] uppercase tracking-widest font-semibold leading-tight">Get Ready With Me</p>
            </div>
          </div>
          {/* Close */}
          <button className="w-8 h-8 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center border border-white/10">
            <span className="text-white text-lg leading-none">×</span>
          </button>
        </div>

        {/* Weather + outfit chip */}
        <div className="mt-3 flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-black/30 backdrop-blur-md rounded-full px-3 py-1.5 border border-white/10">
            <span className="text-base">⛅</span>
            <span className="text-white/90 text-xs font-semibold">56°F · Houston</span>
          </div>
          <div className="flex items-center gap-1.5 bg-[#FF9500]/20 backdrop-blur-md rounded-full px-3 py-1.5 border border-[#FF9500]/30">
            <span className="text-base">👕</span>
            <span className="text-[#FF9500] text-xs font-semibold">Today's Fit: Layers</span>
          </div>
        </div>
      </div>

      {/* Timer */}
      {(recording || recorded) && (
        <div className="absolute top-36 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5">
          {recording && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
          <span className="text-white font-mono text-sm font-bold drop-shadow-lg">
            {Math.floor(timer / 60).toString().padStart(2, "0")}:{(timer % 60).toString().padStart(2, "0")}
          </span>
        </div>
      )}

      {/* Right sidebar tools */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 z-20 flex flex-col items-center gap-5">
        {[
          { icon: "↕", label: "Flip" },
          { icon: "✦", label: "Effects" },
          { icon: "⏱", label: "Timer" },
          { icon: "⚡", label: "Flash" },
        ].map(({ icon, label }) => (
          <button key={label} className="flex flex-col items-center gap-1">
            <div className="w-11 h-11 rounded-full bg-black/30 backdrop-blur-md border border-white/15 flex items-center justify-center shadow">
              <span className="text-white text-lg">{icon}</span>
            </div>
            <span className="text-white/70 text-[10px] font-semibold">{label}</span>
          </button>
        ))}
      </div>

      {/* Music picker modal */}
      {showMusicPicker && (
        <div className="absolute bottom-48 left-4 right-4 z-30 bg-black/80 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
          <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
            <span className="text-white font-bold text-sm">Background Music</span>
            <button onClick={() => setShowMusicPicker(false)} className="text-white/60 text-sm">Done</button>
          </div>
          {MUSIC_TRACKS.map((track, i) => (
            <button
              key={track}
              onClick={() => { setActiveMusic(i); setShowMusicPicker(false); }}
              className={`w-full px-4 py-3 flex items-center gap-3 text-left transition-colors ${i === activeMusic ? "bg-[#FF9500]/15" : "hover:bg-white/5"}`}
            >
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm ${i === activeMusic ? "bg-[#FF9500]" : "bg-white/10"}`}>
                {i === 0 ? "🚫" : "♪"}
              </div>
              <span className={`text-sm font-medium ${i === activeMusic ? "text-[#FF9500]" : "text-white/90"}`}>{track}</span>
              {i === activeMusic && <span className="ml-auto text-[#FF9500] text-xs font-bold">✓</span>}
            </button>
          ))}
        </div>
      )}

      {/* Bottom controls */}
      <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/80 to-transparent pt-12 pb-8 px-4">

        {/* Filter strip */}
        <div className="flex gap-3 overflow-x-auto pb-4 hide-scrollbar">
          {FILTERS.map((f, i) => (
            <button
              key={f.name}
              onClick={() => setActiveFilter(i)}
              className="flex flex-col items-center gap-1.5 shrink-0"
            >
              <div
                className={`w-14 h-14 rounded-2xl border-2 transition-all overflow-hidden ${i === activeFilter ? "border-[#FF9500] scale-105" : "border-white/20"}`}
                style={{ background: "linear-gradient(135deg, #1a1a2e, #0f3460)", ...f.style }}
              >
                <div className="w-full h-full flex items-end justify-center pb-1">
                  <div className="w-5 h-8 rounded-sm bg-white/20" />
                </div>
              </div>
              <span className={`text-[10px] font-semibold ${i === activeFilter ? "text-[#FF9500]" : "text-white/60"}`}>{f.name}</span>
            </button>
          ))}
        </div>

        {/* Music + record row */}
        <div className="flex items-center justify-between mt-1">
          {/* Music selector */}
          <button
            onClick={() => setShowMusicPicker(true)}
            className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md rounded-full px-3 py-2 border border-white/15"
          >
            <span className="text-sm">♪</span>
            <span className="text-white text-xs font-semibold max-w-[80px] truncate">
              {MUSIC_TRACKS[activeMusic]}
            </span>
          </button>

          {/* Record button */}
          <button
            onClick={handleRecord}
            className="relative flex items-center justify-center"
          >
            <div className={`absolute w-20 h-20 rounded-full border-4 transition-colors ${recording ? "border-red-500" : "border-white/60"}`} />
            <div className={`transition-all duration-200 rounded-full bg-red-500 shadow-lg shadow-red-500/50 ${recording ? "w-10 h-10 rounded-xl" : "w-14 h-14"} ${recorded ? "bg-[#FF9500]" : "bg-red-500"}`} />
          </button>

          {/* Download / share */}
          <button className="flex flex-col items-center gap-1">
            <div className="w-11 h-11 rounded-full bg-white/10 backdrop-blur-md border border-white/15 flex items-center justify-center">
              <span className="text-white text-lg">↑</span>
            </div>
            <span className="text-white/60 text-[10px] font-semibold">Share</span>
          </button>
        </div>
      </div>
    </div>
  );
}
