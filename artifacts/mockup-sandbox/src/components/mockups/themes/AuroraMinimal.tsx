export function AuroraMinimal() {
  return (
    <div className="min-h-screen w-full font-sans" style={{ background: "#faf8f5", color: "#1a1a1a" }}>

      {/* Hero */}
      <div className="relative overflow-hidden px-5 pt-14 pb-10"
        style={{ background: "linear-gradient(160deg, #fff4e6 0%, #fde8cc 40%, #ffe4d6 100%)" }}>
        <div className="absolute -top-10 right-0 w-64 h-64 rounded-full opacity-40"
          style={{ background: "radial-gradient(circle, #FF9500 0%, transparent 70%)", filter: "blur(60px)" }} />

        {/* Top bar */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl shadow-sm flex items-center justify-center overflow-hidden"
              style={{ background: "linear-gradient(135deg, #FF9500, #FF6B00)" }}>
              <span className="font-black text-white">F</span>
            </div>
            <div>
              <span className="font-black text-base tracking-tight block" style={{ color: "#1a1a1a" }}>Fit Check</span>
              <span className="text-[9px] uppercase tracking-widest block" style={{ color: "rgba(0,0,0,0.35)" }}>Today's fit, sorted</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full shadow-sm"
            style={{ background: "rgba(255,255,255,0.7)", backdropFilter: "blur(8px)" }}>
            <span className="text-xs">📍</span>
            <span className="text-xs font-semibold" style={{ color: "#666" }}>Houston, TX</span>
          </div>
        </div>

        {/* Weather */}
        <div className="flex flex-col items-center">
          <div className="text-6xl mb-2">⛅</div>
          <div className="text-[88px] font-black tracking-tighter leading-none mb-1" style={{ color: "#1a1a1a" }}>56°</div>
          <div className="text-base font-medium" style={{ color: "rgba(0,0,0,0.45)" }}>Partly Cloudy</div>
          <div className="flex gap-4 mt-3 text-sm" style={{ color: "rgba(0,0,0,0.3)" }}>
            <span>H: 63°</span><span>·</span><span>L: 48°</span><span>·</span><span>Feels 52°</span>
          </div>
        </div>
      </div>

      {/* Outfit card */}
      <div className="mx-4 -mt-5 bg-white rounded-3xl p-5 shadow-sm">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ background: "#FF9500" }} />
            <span className="text-[10px] uppercase tracking-widest font-bold" style={{ color: "#FF9500" }}>The Fit</span>
          </div>
          <div className="px-2.5 py-1 rounded-full text-xs font-black"
            style={{ background: "#fff4e6", color: "#FF9500" }}>FIT 92</div>
        </div>
        <h2 className="text-xl font-black leading-tight mb-4" style={{ color: "#1a1a1a" }}>
          Your favorite jacket over a simple long sleeve and jeans.
        </h2>
        <div className="space-y-1.5">
          {[["Layer up", "A dependable jacket"], ["Footwear", "Closed-toe shoes"]].map(([label, val]) => (
            <div key={label} className="flex items-center gap-3">
              <span className="text-[10px] uppercase tracking-widest font-bold w-16 shrink-0" style={{ color: "rgba(0,0,0,0.3)" }}>{label}</span>
              <span className="text-sm font-medium" style={{ color: "#444" }}>{val}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Hourly */}
      <div className="mx-4 mt-3 bg-white rounded-3xl p-4 shadow-sm">
        <div className="flex gap-5 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
          {[
            { t: "Now", deg: "56°", icon: "⛅" },
            { t: "1 AM", deg: "54°", icon: "☁️" },
            { t: "2 AM", deg: "53°", icon: "☁️" },
            { t: "3 AM", deg: "51°", icon: "🌧" },
            { t: "4 AM", deg: "50°", icon: "🌧" },
          ].map(({ t, deg, icon }, i) => (
            <div key={t} className="flex flex-col items-center gap-2 shrink-0 w-12">
              <span className="text-[10px] font-bold" style={{ color: i === 0 ? "#FF9500" : "rgba(0,0,0,0.3)" }}>{t}</span>
              <span className="text-lg">{icon}</span>
              <span className="text-xs font-semibold" style={{ color: "#444" }}>{deg}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Closet picks */}
      <div className="mx-4 mt-3">
        <div className="text-[10px] uppercase tracking-widest font-bold mb-3" style={{ color: "rgba(0,0,0,0.3)" }}>Wear Today</div>
        <div className="flex gap-3">
          {[["👕", "Henley"], ["👖", "Jeans"], ["🧥", "Bomber"]].map(([icon, label]) => (
            <div key={String(label)} className="flex-1 bg-white rounded-2xl py-4 flex flex-col items-center gap-2 shadow-sm">
              <span className="text-2xl">{icon}</span>
              <span className="text-[10px] font-semibold text-center" style={{ color: "rgba(0,0,0,0.35)" }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Nav */}
      <div className="fixed bottom-0 left-0 right-0 px-6 pt-3 pb-6 flex justify-around bg-white"
        style={{ borderTop: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 -4px 24px rgba(0,0,0,0.04)" }}>
        {[["🏠", "Home", true], ["☁️", "Forecast", false], ["🎬", "GRWM", false], ["👔", "Closet", false], ["⚙️", "Settings", false]].map(([icon, label, active]) => (
          <div key={String(label)} className="flex flex-col items-center gap-1">
            <span className="text-xl">{icon}</span>
            <span className="text-[9px] font-semibold" style={{ color: active ? "#FF9500" : "rgba(0,0,0,0.3)" }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
