import { motion } from "framer-motion";
import { useMemo } from "react";
import { getWeatherInfo } from "@/lib/weather-codes";

// src/components/WeatherBackground.tsx
// Renders an animated, atmospheric background based on weather code and time of day.

interface WeatherBackgroundProps {
  weatherCode: number;
  isDay: boolean;
}

export function WeatherBackground({ weatherCode, isDay }: WeatherBackgroundProps) {
  const info = getWeatherInfo(weatherCode);
  const cat = info.category;

  const bgStyles = useMemo(() => {
    if (!isDay) {
      if (cat === "clear" || cat === "partly-cloudy") {
        return "bg-gradient-to-br from-indigo-950 via-slate-900 to-black";
      }
      return "bg-gradient-to-br from-slate-900 via-slate-800 to-black";
    }

    switch (cat) {
      case "clear":
        return "bg-gradient-to-br from-sky-400 via-blue-300 to-blue-200";
      case "partly-cloudy":
        return "bg-gradient-to-br from-sky-300 via-blue-200 to-slate-200";
      case "cloudy":
      case "fog":
        return "bg-gradient-to-br from-slate-300 via-slate-200 to-zinc-300";
      case "rain":
      case "drizzle":
      case "showers":
        return "bg-gradient-to-br from-slate-500 via-slate-400 to-zinc-400";
      case "snow":
        return "bg-gradient-to-br from-indigo-200 via-slate-200 to-purple-100";
      case "thunderstorm":
        return "bg-gradient-to-br from-slate-700 via-slate-600 to-zinc-600";
      default:
        return "bg-gradient-to-br from-sky-200 to-blue-100";
    }
  }, [cat, isDay]);

  return (
    <div className={`absolute inset-0 z-0 overflow-hidden transition-colors duration-1000 ${bgStyles}`}>
      {/* Decorative overlays */}
      
      {/* Sun glow */}
      {isDay && (cat === "clear" || cat === "partly-cloudy") && (
        <motion.div
          animate={{ scale: [1, 1.05, 1], opacity: [0.6, 0.8, 0.6] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-24 -right-24 w-96 h-96 bg-[#FF9500]/30 rounded-full blur-3xl"
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
          className="absolute -top-12 -left-12 w-full h-64 bg-white/20 dark:bg-white/5 rounded-full blur-3xl"
        />
      )}

      {/* Rain/Dark moody overlay */}
      {(cat === "rain" || cat === "drizzle" || cat === "showers" || cat === "thunderstorm") && (
        <div className="absolute inset-0 bg-slate-900/10 dark:bg-slate-900/30 mix-blend-multiply" />
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
