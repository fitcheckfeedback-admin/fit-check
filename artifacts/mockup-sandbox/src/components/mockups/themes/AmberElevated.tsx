export function AmberElevated() {
  return (
    <div className="min-h-screen w-full font-sans" style={{ background: "#0F0A00", color: "#fff" }}>

      {/* Hero */}
      <div className="relative overflow-hidden px-5 pt-14 pb-10"
        style={{ background: "linear-gradient(160deg, #1a0f00 0%, #2d1800 50%, #1a0f00 100%)" }}>
        {/* Amber glow */}
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full opacity-30"
          style={{ background: "radial-gradient(circle, #FF9500 0%, transparent 70%)", filter: "blur(40px)" }} />

        {/* Top bar */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #FF9500, #FF6B00)" }}>
              <span className="font-black text-white text-sm">F</span>
            </div>
            <div>
              <span className="font-black text-sm tracking-tight block" style={{ color: "#FF9500" }}>Fit Check</span>
              <span className="text-[9px] uppercase tracking-[0.15em] block" style={{ color: "rgba(255,149,0,0.5)" }}>Today's fit, sorted</span>
            </div>
          </div>
          <div className="px-3 py-1.5 rounded-full text-xs font-semibold"
            style={{ background: "rgba(255,149,0,0.12)", color: "#FF9500", border: "1px solid rgba(255,149,0,0.25)" }}>
            📍 Houston, TX
          </div>
        </div>

        {/* Weather */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="text-7xl mb-1">⛅</div>
          <div className="text-8xl font-black tracking-tighter mb-1" style={{
            background: "linear-gradient(180deg, #fff 0%, rgba(255,255,255,0.6) 100%)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
          }}>56°</div>
          <div className="text-lg font-semibold" style={{ color: "rgba(255,255,255,0.6)" }}>Partly Cloudy</div>
          <div className="flex gap-4 mt-3 text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
            <span>H: 63°</span><span>·</span><span>L: 48°</span><span>·</span><span>Feels 52°</span>
          </div>
        </div>
      </div>

      {/* Outfit card */}
      <div className="mx-4 -mt-5 rounded-3xl p-5 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #1f1200 0%, #2a1800 100%)", border: "1px solid rgba(255,149,0,0.2)" }}>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#FF9500" }} />
          <span className="text-[10px] uppercase tracking-widest font-bold" style={{ color: "#FF9500" }}>The Fit</span>
          <div className="ml-auto px-2.5 py-1 rounded-full text-xs font-black" style={{ background: "rgba(255,149,0,0.15)", color: "#FF9500" }}>FIT 92</div>
        </div>
        <h2 className="text-2xl font-black leading-tight mb-4">Your favorite jacket over a long sleeve and jeans.</h2>
        <div className="space-y-2">
          {[["Layer up", "A dependable jacket"], ["Footwear", "Closed-toe shoes"]].map(([label, val]) => (
            <div key={label} className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-widest font-bold w-16 shrink-0" style={{ color: "rgba(255,149,0,0.5)" }}>{label}</span>
              <span className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.7)" }}>{val}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Hourly */}
      <div className="mx-4 mt-4 rounded-3xl p-4" style={{ background: "#150d00", border: "1px solid rgba(255,149,0,0.1)" }}>
        <div className="flex gap-4 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
          {[
            { t: "Now", deg: "56°", icon: "⛅" },
            { t: "1 AM", deg: "54°", icon: "☁️" },
            { t: "2 AM", deg: "53°", icon: "☁️" },
            { t: "3 AM", deg: "51°", icon: "🌧" },
            { t: "4 AM", deg: "50°", icon: "🌧" },
          ].map(({ t, deg, icon }) => (
            <div key={t} className="flex flex-col items-center gap-2 shrink-0 w-12">
              <span className="text-[10px] font-bold" style={{ color: t === "Now" ? "#FF9500" : "rgba(255,255,255,0.35)" }}>{t}</span>
              <span className="text-xl">{icon}</span>
              <span className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.7)" }}>{deg}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Wear today */}
      <div className="mx-4 mt-4">
        <h3 className="text-xs uppercase tracking-widest font-bold mb-3" style={{ color: "rgba(255,149,0,0.5)" }}>Wear Today</h3>
        <div className="flex gap-3">
          {[["👕", "Henley"], ["👖", "Dark Jeans"], ["🧥", "Bomber"]].map(([icon, label]) => (
            <div key={label} className="flex-1 rounded-2xl p-3 flex flex-col items-center gap-2"
              style={{ background: "#1a0f00", border: "1px solid rgba(255,149,0,0.12)" }}>
              <span className="text-2xl">{icon}</span>
              <span className="text-[10px] font-semibold text-center" style={{ color: "rgba(255,255,255,0.5)" }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Nav */}
      <div className="fixed bottom-0 left-0 right-0 px-6 py-4 flex justify-around"
        style={{ background: "rgba(15,10,0,0.95)", borderTop: "1px solid rgba(255,149,0,0.12)", backdropFilter: "blur(20px)" }}>
        {[["🏠", "Home", true], ["☁️", "Forecast", false], ["🎬", "GRWM", false], ["👔", "Closet", false], ["⚙️", "Settings", false]].map(([icon, label, active]) => (
          <div key={String(label)} className="flex flex-col items-center gap-1">
            <span className="text-xl">{icon}</span>
            <span className="text-[9px] font-semibold" style={{ color: active ? "#FF9500" : "rgba(255,255,255,0.3)" }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
