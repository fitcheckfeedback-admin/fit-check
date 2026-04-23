import { motion } from "framer-motion";
import { useMemo, useRef } from "react";
import { getWeatherInfo } from "@/lib/weather-codes";

interface WeatherBackgroundProps {
  weatherCode: number;
  isDay: boolean;
}

const RAIN_DROPS = Array.from({ length: 40 }, (_, i) => ({
  id: i,
  x: `${Math.random() * 100}%`,
  delay: Math.random() * 1.5,
  speed: 0.6 + Math.random() * 0.6,
  height: 12 + Math.random() * 18,
  opacity: 0.2 + Math.random() * 0.25,
}));

const SNOW_FLAKES = Array.from({ length: 28 }, (_, i) => ({
  id: i,
  x: `${Math.random() * 100}%`,
  delay: Math.random() * 4,
  speed: 2.5 + Math.random() * 3,
  size: 2 + Math.random() * 3,
  drift: (Math.random() - 0.5) * 30,
}));

export function WeatherBackground({ weatherCode, isDay }: WeatherBackgroundProps) {
  const info = getWeatherInfo(weatherCode);
  const cat = info.category;

  const isRainy  = cat === "rain" || cat === "drizzle" || cat === "showers";
  const isStormy = cat === "thunderstorm";
  const isSnowy  = cat === "snow";
  const isClear  = cat === "clear";
  const isPartly = cat === "partly-cloudy";
  const isCloudy = cat === "cloudy" || cat === "fog";
  const isCold   = isSnowy;

  const { bg, bgStyle } = useMemo(() => {
    if (!isDay) {
      if (isClear || isPartly)
        return { bg: "", bgStyle: { background: "linear-gradient(160deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)" } };
      if (isRainy || isStormy)
        return { bg: "", bgStyle: { background: "linear-gradient(160deg, #0c1220 0%, #111827 60%, #0c1220 100%)" } };
      return { bg: "", bgStyle: { background: "linear-gradient(160deg, #1e293b 0%, #0f172a 100%)" } };
    }

    if (isClear)
      return { bg: "", bgStyle: { background: "linear-gradient(160deg, #fff4dc 0%, #fde68a 30%, #fdba74 70%, #fb923c 100%)" } };
    if (isPartly)
      return { bg: "", bgStyle: { background: "linear-gradient(160deg, #fef9ee 0%, #fde68a 40%, #fed7aa 100%)" } };
    if (isCloudy)
      return { bg: "", bgStyle: { background: "linear-gradient(160deg, #e2e8f0 0%, #cbd5e1 50%, #b8c5d6 100%)" } };
    if (isRainy)
      return { bg: "", bgStyle: { background: "linear-gradient(160deg, #94a3b8 0%, #64748b 40%, #475569 100%)" } };
    if (isStormy)
      return { bg: "", bgStyle: { background: "linear-gradient(160deg, #334155 0%, #1e293b 50%, #0f172a 100%)" } };
    if (isSnowy)
      return { bg: "", bgStyle: { background: "linear-gradient(160deg, #e0f2fe 0%, #bae6fd 40%, #c7d2fe 100%)" } };

    return { bg: "", bgStyle: { background: "linear-gradient(160deg, #fff4dc 0%, #fde68a 100%)" } };
  }, [cat, isDay, isClear, isPartly, isCloudy, isRainy, isStormy, isSnowy]);

  return (
    <div
      className={`absolute inset-0 z-0 overflow-hidden transition-all duration-1000 ${bg}`}
      style={bgStyle}
    >
      {/* ── SUNNY: warm radial glow ── */}
      {isDay && (isClear || isPartly) && (
        <>
          <motion.div
            animate={{ scale: [1, 1.15, 1], opacity: [0.55, 0.85, 0.55] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-20 -right-20 w-80 h-80 rounded-full blur-3xl pointer-events-none"
            style={{ background: "radial-gradient(circle, #fb923c 0%, #fbbf24 40%, transparent 72%)" }}
          />
          <motion.div
            animate={{ scale: [1, 1.08, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            className="absolute top-10 left-0 w-64 h-64 rounded-full blur-3xl pointer-events-none"
            style={{ background: "radial-gradient(circle, #fde68a 0%, transparent 70%)" }}
          />
        </>
      )}

      {/* ── NIGHT CLEAR: moon + stars ── */}
      {!isDay && (isClear || isPartly) && (
        <>
          <motion.div
            animate={{ scale: [1, 1.04, 1], opacity: [0.35, 0.55, 0.35] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-8 right-10 w-52 h-52 rounded-full blur-3xl pointer-events-none"
            style={{ background: "radial-gradient(circle, #818cf8 0%, transparent 70%)" }}
          />
          {[{ top: "15%", left: "20%", size: 2 }, { top: "30%", left: "60%", size: 1.5 }, { top: "10%", left: "75%", size: 2.5 }, { top: "50%", left: "35%", size: 1 }].map((s, i) => (
            <motion.div
              key={i}
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 2 + i, repeat: Infinity, delay: i * 0.7 }}
              className="absolute rounded-full bg-white pointer-events-none"
              style={{ top: s.top, left: s.left, width: s.size, height: s.size }}
            />
          ))}
        </>
      )}

      {/* ── CLOUDY: drifting cloud mass ── */}
      {(isCloudy || isPartly) && (
        <motion.div
          animate={{ x: [0, 24, 0] }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-10 -left-10 w-full h-48 rounded-full blur-3xl pointer-events-none opacity-60"
          style={{ background: isDay ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.04)" }}
        />
      )}

      {/* ── RAIN: streak animation ── */}
      {(isRainy || isStormy) && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {RAIN_DROPS.map((drop) => (
            <motion.div
              key={drop.id}
              className="absolute rounded-full"
              style={{
                left: drop.x,
                top: -drop.height,
                width: 1.5,
                height: drop.height,
                opacity: drop.opacity,
                background: isDay
                  ? "linear-gradient(to bottom, transparent, #94a3b8)"
                  : "linear-gradient(to bottom, transparent, #7dd3fc)",
              }}
              animate={{ y: ["0vh", "110vh"] }}
              transition={{
                duration: drop.speed,
                repeat: Infinity,
                delay: drop.delay,
                ease: "linear",
              }}
            />
          ))}
        </div>
      )}

      {/* ── THUNDER: moody overlay + lightning ── */}
      {isStormy && (
        <>
          <div className="absolute inset-0 bg-slate-900/40 pointer-events-none" />
          <motion.div
            animate={{ opacity: [0, 0, 0.7, 0, 0.4, 0, 0, 0] }}
            transition={{ duration: 9, repeat: Infinity, ease: "circIn", delay: 2 }}
            className="absolute inset-0 bg-white/20 mix-blend-overlay pointer-events-none"
          />
        </>
      )}

      {/* ── SNOW: drifting flakes ── */}
      {isSnowy && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {SNOW_FLAKES.map((flake) => (
            <motion.div
              key={flake.id}
              className="absolute rounded-full bg-white/80"
              style={{ left: flake.x, top: -10, width: flake.size, height: flake.size }}
              animate={{ y: ["0vh", "110vh"], x: [0, flake.drift, 0] }}
              transition={{
                duration: flake.speed,
                repeat: Infinity,
                delay: flake.delay,
                ease: "linear",
                x: { duration: flake.speed * 0.6, repeat: Infinity, ease: "easeInOut" },
              }}
            />
          ))}
          <div className="absolute inset-0 bg-blue-100/20 pointer-events-none" />
        </div>
      )}

      {/* ── SUBTLE NOISE texture overlay ── */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")" }}
      />
    </div>
  );
}
