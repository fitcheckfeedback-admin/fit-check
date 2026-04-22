import { WeatherAlert } from "./weatherAlerts";
import { motion, AnimatePresence } from "framer-motion";
import { CloudRain, Zap, Snowflake, Thermometer, Wind, Umbrella, Droplets, Shirt, ChevronDown } from "lucide-react";
import { useState } from "react";

const iconMap: Record<string, any> = {
  CloudRain,
  Zap,
  Snowflake,
  Thermometer,
  Wind,
  Umbrella,
  Droplets,
};

interface WeatherAlertBannerProps {
  alerts: WeatherAlert[];
}

export function WeatherAlertBanner({ alerts }: WeatherAlertBannerProps) {
  const [expanded, setExpanded] = useState(false);
  
  if (!alerts || alerts.length === 0) return null;

  const primaryAlert = alerts[0];
  const restAlerts = alerts.slice(1);
  const displayAlerts = expanded ? alerts : [primaryAlert];

  return (
    <div className="flex flex-col gap-3 w-full">
      <AnimatePresence>
        {displayAlerts.map((alert) => {
          const Icon = iconMap[alert.icon] || Wind;
          return (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              className={`rounded-2xl p-4 border-l-4 border-l-current ${alert.color} ${alert.bgColor} shadow-sm overflow-hidden`}
            >
              <div className="flex items-start gap-3">
                <Icon className="w-6 h-6 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-bold text-base leading-tight text-foreground/90">{alert.title}</h4>
                  <p className="text-sm font-medium text-foreground/70 mt-1">{alert.description}</p>
                  
                  <div className="mt-3 bg-background/50 dark:bg-background/20 rounded-xl p-3 flex items-start gap-2 border border-border/10">
                    <Shirt className="w-4 h-4 shrink-0 mt-0.5 opacity-70" />
                    <p className="text-sm italic font-medium leading-snug text-foreground/80">{alert.outfitTip}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
      
      {!expanded && restAlerts.length > 0 && (
        <button
          onClick={() => setExpanded(true)}
          className="mx-auto flex items-center justify-center gap-1.5 px-4 py-1.5 bg-muted/50 hover:bg-muted text-muted-foreground rounded-full text-xs font-semibold transition-colors"
        >
          + {restAlerts.length} more alerts
          <ChevronDown className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}