export function DarkObsidian() {
  return (
    <div className="min-h-screen w-full font-sans" style={{ background: "#080808", color: "#fff" }}>

      {/* Hero */}
      <div className="relative overflow-hidden px-5 pt-14 pb-12"
        style={{ background: "linear-gradient(180deg, #0d0d0d 0%, #111 100%)" }}>
        <div className="absolute top-0 left-0 right-0 h-64 opacity-20"
          style={{ background: "radial-gradient(ellipse at 50% 0%, #b8960c 0%, transparent 70%)" }} />

        {/* Top bar */}
        <div className="flex items-center justify-between mb-10 relative">
          <div>
            <span className="text-[10px] uppercase tracking-[0.2em] font-medium block" style={{ color: "rgba(255,255,255,0.3)" }}>Good morning</span>
            <div className="flex items-center gap-2 mt-1">
              <span className="font-black text-xl tracking-tight" style={{
                background: "linear-gradient(90deg, #D4A017, #F5C842)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
              }}>Fit Check</span>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>📍</span>
            <span className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.5)" }}>Houston</span>
          </div>
        </div>

        {/* Big temp */}
        <div className="text-center mb-6">
          <div className="text-[96px] font-black leading-none tracking-tighter" style={{
            background: "linear-gradient(180deg, #fff 30%, rgba(255,255,255,0.3) 100%)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
          }}>56°</div>
          <div className="text-sm font-medium mt-1" style={{ color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em" }}>PARTLY CLOUDY</div>
          <div className="flex justify-center gap-6 mt-4 text-xs" style={{ color: "rgba(255,255,255,0.2)" }}>
            <span>HIGH 63°</span><span>LOW 48°</span><span>FEELS 52°</span>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px mx-6" style={{ background: "linear-gradient(90deg, transparent, rgba(212,160,23,0.3), transparent)" }} />

      {/* Outfit card */}
      <div className="mx-4 mt-5 rounded-2xl p-5 relative"
        style={{ background: "#111", border: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="absolute top-4 right-4 text-xs font-black px-2 py-1 rounded-full"
          style={{ background: "rgba(212,160,23,0.15)", color: "#D4A017", border: "1px solid rgba(212,160,23,0.2)" }}>92</div>
        <div className="text-[9px] uppercase tracking-[0.18em] mb-3" style={{ color: "rgba(212,160,23,0.6)" }}>Today's Fit</div>
        <h2 className="text-xl font-black leading-snug mb-5" style={{ color: "rgba(255,255,255,0.9)" }}>
          Jacket over a long sleeve.<br />Dark jeans. Closed-toe.
        </h2>
        <div className="flex gap-2">
          {["Layer", "Footwear", "Style"].map(tag => (
            <span key={tag} className="text-[10px] px-2.5 py-1 rounded-full font-medium"
              style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.35)", border: "1px solid rgba(255,255,255,0.06)" }}>
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Hourly strip */}
      <div className="px-4 mt-5">
        <div className="flex gap-5 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
          {[
            { t: "Now", deg: "56°", icon: "⛅" },
            { t: "1AM", deg: "54°", icon: "☁️" },
            { t: "2AM", deg: "53°", icon: "☁️" },
            { t: "3AM", deg: "51°", icon: "🌧" },
            { t: "4AM", deg: "50°", icon: "🌧" },
          ].map(({ t, deg, icon }, i) => (
            <div key={t} className="flex flex-col items-center gap-2 shrink-0">
              <span className="text-[10px] uppercase tracking-wider" style={{ color: i === 0 ? "#D4A017" : "rgba(255,255,255,0.2)" }}>{t}</span>
              <span className="text-lg">{icon}</span>
              <span className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.5)" }}>{deg}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Closet picks */}
      <div className="px-4 mt-6">
        <div className="text-[9px] uppercase tracking-[0.18em] mb-3" style={{ color: "rgba(255,255,255,0.2)" }}>From Your Closet</div>
        <div className="flex gap-3">
          {[["👕", "Henley Top"], ["👖", "Dark Jeans"], ["🧥", "Bomber"]].map(([icon, label]) => (
            <div key={String(label)} className="flex-1 py-4 rounded-2xl flex flex-col items-center gap-2"
              style={{ background: "#111", border: "1px solid rgba(255,255,255,0.05)" }}>
              <span className="text-3xl">{icon}</span>
              <span className="text-[10px] font-medium text-center" style={{ color: "rgba(255,255,255,0.25)" }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Nav */}
      <div className="fixed bottom-0 left-0 right-0 px-6 pt-4 pb-6 flex justify-around"
        style={{ background: "rgba(8,8,8,0.97)", borderTop: "1px solid rgba(255,255,255,0.04)", backdropFilter: "blur(20px)" }}>
        {[["🏠", "Home", true], ["☁️", "Forecast", false], ["🎬", "GRWM", false], ["👔", "Closet", false], ["⚙️", "Settings", false]].map(([icon, label, active]) => (
          <div key={String(label)} className="flex flex-col items-center gap-1">
            <span className="text-xl">{icon}</span>
            <span className="text-[9px] font-semibold" style={{ color: active ? "#D4A017" : "rgba(255,255,255,0.2)" }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
