import { motion } from "framer-motion";
import { useMemo } from "react";
import { getWeatherInfo } from "@/lib/weather-codes";

interface WeatherBackgroundProps {
  weatherCode: number;
  isDay: boolean;
}

export function WeatherBackground({ weatherCode, isDay }: WeatherBackgroundProps) {
  const info = getWeatherInfo(weatherCode);
  const cat = info.category;

  const { bgClass, bgStyle } = useMemo(() => {
    if (!isDay) {
      if (cat === "clear" || cat === "partly-cloudy") {
        return { bgClass: "bg-gradient-to-br from-indigo-950 via-slate-900 to-black", bgStyle: undefined };
      }
      return { bgClass: "bg-gradient-to-br from-slate-900 via-slate-800 to-black", bgStyle: undefined };
    }

    // Light mode: warm cream/amber palette
    const gradients: Record<string, string> = {
      clear:          "linear-gradient(160deg, #fff9f0 0%, #fdebd0 50%, #fde8cc 100%)",
      "partly-cloudy": "linear-gradient(160deg, #fff4e6 0%, #fde8cc 40%, #ffe4d6 100%)",
      cloudy:         "linear-gradient(160deg, #f5f0ea 0%, #ede6dc 50%, #e8e0d5 100%)",
      fog:            "linear-gradient(160deg, #f5f0ea 0%, #ede6dc 50%, #e8e0d5 100%)",
      rain:           "linear-gradient(160deg, #ede8e2 0%, #e0d8cf 50%, #d8cfc5 100%)",
      drizzle:        "linear-gradient(160deg, #ede8e2 0%, #e0d8cf 50%, #d8cfc5 100%)",
      showers:        "linear-gradient(160deg, #ede8e2 0%, #e0d8cf 50%, #d8cfc5 100%)",
      snow:           "linear-gradient(160deg, #f0eef8 0%, #e8e4f0 40%, #f0eae8 100%)",
      thunderstorm:   "linear-gradient(160deg, #ddd8d0 0%, #d0c8be 50%, #c8c0b5 100%)",
    };

    return {
      bgClass: "",
      bgStyle: { background: gradients[cat] ?? "linear-gradient(160deg, #fff4e6 0%, #fde8cc 100%)" },
    };
  }, [cat, isDay]);

  return (
    <div
      className={`absolute inset-0 z-0 overflow-hidden transition-colors duration-1000 ${bgClass}`}
      style={bgStyle}
    >
      {/* Sun glow for clear/partly-cloudy days */}
      {isDay && (cat === "clear" || cat === "partly-cloudy") && (
        <motion.div
          animate={{ scale: [1, 1.05, 1], opacity: [0.4, 0.65, 0.4] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-24 -right-24 w-96 h-96 rounded-full blur-3xl"
          style={{ background: "radial-gradient(circle, #FF9500 0%, transparent 70%)" }}
        />
      )}

      {/* Moon glow */}
      {!isDay && (cat === "clear" || cat === "partly-cloudy") && (
        <motion.div
          animate={{ scale: [1, 1.02, 1], opacity: [0.3, 0.4, 0.3] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-12 right-12 w-64 h-64 bg-indigo-400/20 rounded-full blur-3xl"
        />
      )}

      {/* Clouds */}
      {(cat === "partly-cloudy" || cat === "cloudy" || cat === "fog") && (
        <motion.div
          animate={{ x: [0, 20, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-12 -left-12 w-full h-64 bg-white/30 dark:bg-white/5 rounded-full blur-3xl"
        />
      )}

      {/* Rain moody overlay */}
      {(cat === "rain" || cat === "drizzle" || cat === "showers" || cat === "thunderstorm") && (
        <div className="absolute inset-0 bg-slate-900/8 dark:bg-slate-900/30 mix-blend-multiply" />
      )}

      {/* Lightning flash */}
      {cat === "thunderstorm" && (
        <motion.div
          animate={{ opacity: [0, 0, 0.8, 0, 0.4, 0, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "circIn" }}
          className="absolute inset-0 bg-white/20 mix-blend-overlay"
        />
      )}
    </div>
  );
}
