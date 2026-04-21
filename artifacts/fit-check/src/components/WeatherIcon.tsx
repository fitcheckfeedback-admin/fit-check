import { motion } from "framer-motion";
import { 
  Sun, 
  CloudSun, 
  Cloud, 
  CloudFog, 
  CloudDrizzle, 
  CloudRain, 
  CloudSnow, 
  CloudLightning 
} from "lucide-react";
import { WeatherCategory } from "@/lib/weather-codes";

interface WeatherIconProps {
  category: WeatherCategory;
  className?: string;
}

const iconMap = {
  "clear": Sun,
  "partly-cloudy": CloudSun,
  "cloudy": Cloud,
  "fog": CloudFog,
  "drizzle": CloudDrizzle,
  "rain": CloudRain,
  "showers": CloudRain,
  "snow": CloudSnow,
  "thunderstorm": CloudLightning,
};

export function WeatherIcon({ category, className }: WeatherIconProps) {
  const IconComponent = iconMap[category] || Cloud;

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ 
        type: "spring",
        stiffness: 260,
        damping: 20 
      }}
      className={className}
    >
      <IconComponent className="w-full h-full" strokeWidth={1.5} />
    </motion.div>
  );
}
