import { motion } from "framer-motion";
import { getWeatherInfo } from "@/lib/weather-codes";

// src/components/WeatherScene.tsx
// Animated SVG illustration representing the current weather.

interface WeatherSceneProps {
  weatherCode: number;
  className?: string;
  isDay?: boolean;
}

export function WeatherScene({ weatherCode, className = "w-32 h-32", isDay = true }: WeatherSceneProps) {
  const info = getWeatherInfo(weatherCode);
  const cat = info.category;

  const sun = (
    <motion.g
      animate={{ rotate: 360 }}
      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      className="origin-center"
      style={{ transformOrigin: "50px 50px" }}
    >
      <circle cx="50" cy="50" r="20" fill={isDay ? "#FF9500" : "#C4D3DF"} />
      {isDay && (
        <>
          <line x1="50" y1="15" x2="50" y2="5" stroke="#FF9500" strokeWidth="4" strokeLinecap="round" />
          <line x1="50" y1="85" x2="50" y2="95" stroke="#FF9500" strokeWidth="4" strokeLinecap="round" />
          <line x1="15" y1="50" x2="5" y2="50" stroke="#FF9500" strokeWidth="4" strokeLinecap="round" />
          <line x1="85" y1="50" x2="95" y2="50" stroke="#FF9500" strokeWidth="4" strokeLinecap="round" />
          <line x1="25" y1="25" x2="18" y2="18" stroke="#FF9500" strokeWidth="4" strokeLinecap="round" />
          <line x1="75" y1="75" x2="82" y2="82" stroke="#FF9500" strokeWidth="4" strokeLinecap="round" />
          <line x1="25" y1="75" x2="18" y2="82" stroke="#FF9500" strokeWidth="4" strokeLinecap="round" />
          <line x1="75" y1="25" x2="82" y2="18" stroke="#FF9500" strokeWidth="4" strokeLinecap="round" />
        </>
      )}
    </motion.g>
  );

  const cloud = (
    <motion.g
      animate={{ y: [-2, 2, -2] }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
    >
      <path 
        d="M25 60 A15 15 0 0 1 25 30 A20 20 0 0 1 65 30 A15 15 0 0 1 65 60 Z" 
        fill={cat === "thunderstorm" || cat === "rain" ? "#64748B" : "#F8FAFC"} 
        stroke={cat === "thunderstorm" || cat === "rain" ? "#475569" : "#E2E8F0"} 
        strokeWidth="2"
      />
    </motion.g>
  );

  const rain = (
    <motion.g>
      {[35, 45, 55].map((x, i) => (
        <motion.line
          key={i}
          x1={x} y1="65" x2={x - 5} y2="75"
          stroke="#3B82F6" strokeWidth="3" strokeLinecap="round"
          animate={{ y: [0, 10, 20], opacity: [0, 1, 0] }}
          transition={{ duration: 1, repeat: Infinity, delay: i * 0.2, ease: "linear" }}
        />
      ))}
    </motion.g>
  );

  const snow = (
    <motion.g>
      {[35, 45, 55].map((x, i) => (
        <motion.circle
          key={i}
          cx={x} cy="65" r="3"
          fill="#E0F2FE"
          animate={{ y: [0, 15, 30], x: [0, i % 2 === 0 ? -5 : 5, 0], opacity: [0, 1, 0] }}
          transition={{ duration: 2, repeat: Infinity, delay: i * 0.4, ease: "linear" }}
        />
      ))}
    </motion.g>
  );

  const lightning = (
    <motion.path
      d="M45 55 L35 75 L50 75 L45 95 L65 65 L50 65 Z"
      fill="#FBBF24"
      animate={{ opacity: [1, 0, 1, 1, 0, 1] }}
      transition={{ duration: 3, repeat: Infinity, times: [0, 0.1, 0.2, 0.8, 0.9, 1] }}
    />
  );

  return (
    <div className={className}>
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-md">
        {cat === "clear" && sun}
        {cat === "partly-cloudy" && (
          <g>
            <g transform="translate(15, -10) scale(0.8)">{sun}</g>
            <g transform="translate(10, 15)">{cloud}</g>
          </g>
        )}
        {cat === "cloudy" && <g transform="translate(10, 15)">{cloud}</g>}
        {cat === "fog" && <g transform="translate(10, 15)">{cloud}</g>}
        {cat === "rain" && (
          <g transform="translate(10, 10)">
            {cloud}
            {rain}
          </g>
        )}
        {cat === "drizzle" && (
          <g transform="translate(10, 10)">
            {cloud}
            {rain}
          </g>
        )}
        {cat === "showers" && (
          <g transform="translate(10, 10)">
            {cloud}
            {rain}
          </g>
        )}
        {cat === "snow" && (
          <g transform="translate(10, 10)">
            {cloud}
            {snow}
          </g>
        )}
        {cat === "thunderstorm" && (
          <g transform="translate(10, 10)">
            {cloud}
            {lightning}
            {rain}
          </g>
        )}
      </svg>
    </div>
  );
}
