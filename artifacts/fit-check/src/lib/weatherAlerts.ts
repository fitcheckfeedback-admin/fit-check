import { RecommendationInput } from "./recommend";

export type AlertSeverity = "advisory" | "watch" | "warning";

export interface WeatherAlert {
  id: string;
  severity: AlertSeverity;
  title: string;
  description: string;
  outfitTip: string;
  icon: string;
  color: string;
  bgColor: string;
}

function isStormCode(code: number) {
  return code >= 95 && code <= 99;
}
function isHeavyRainCode(code: number) {
  return (code >= 51 && code <= 67) || (code >= 80 && code <= 82);
}
function isSnowCode(code: number) {
  return (code >= 71 && code <= 77) || (code >= 85 && code <= 86);
}

export function detectAlerts(input: RecommendationInput): WeatherAlert[] {
  const alerts: WeatherAlert[] = [];
  const {
    temperatureF, precipChance, weatherCode, windMph, windGustsMph = 0,
    humidity, upcomingCodes = [], rainMm = 0, showersMm = 0, snowfallCm = 0,
  } = input;

  // Measured precipitation takes priority over forecast codes
  const isRainingNow = rainMm > 0 || showersMm > 0;
  const isSnowingNow = snowfallCm > 0;

  const isThunderstorm = isStormCode(weatherCode);
  const incomingStorm = !isThunderstorm && upcomingCodes.some(isStormCode);
  const isHeavyRain = (precipChance >= 70 && isHeavyRainCode(weatherCode)) || (isRainingNow && (rainMm + showersMm) >= 1.5);
  const incomingHeavyRain = !isThunderstorm && !incomingStorm && !isHeavyRain
    && upcomingCodes.some(isHeavyRainCode) && precipChance >= 50;
  const isHeavySnow = isSnowCode(weatherCode) || (isSnowingNow && snowfallCm >= 0.5);
  const incomingSnow = !isHeavySnow && upcomingCodes.some(isSnowCode);
  const effectiveWindMph = Math.max(windMph, windGustsMph * 0.7);
  const isHighWind = effectiveWindMph >= 30 || windGustsMph >= 45;
  const isRainLikely = (precipChance >= 40 || isRainingNow) && precipChance < 70
    && !isThunderstorm && !isHeavyRain && !isHeavySnow && !incomingStorm;

  if (isThunderstorm) {
    alerts.push({ id: "thunderstorm", severity: "warning", title: "Thunderstorms", description: "Dangerous lightning in the area.", outfitTip: "Stay indoors if possible. If you must go out — full waterproof kit, no metal accessories.", icon: "Zap", color: "text-yellow-600", bgColor: "bg-yellow-50 dark:bg-yellow-950/30" });
  } else if (incomingStorm) {
    alerts.push({ id: "incoming-storm", severity: "warning", title: "Storm Moving In", description: "Thunderstorms expected within the next few hours.", outfitTip: "Plan to be indoors when it hits. Carry a compact umbrella and skip the metal accessories.", icon: "Zap", color: "text-yellow-600", bgColor: "bg-yellow-50 dark:bg-yellow-950/30" });
  } else if (isHeavyRain) {
    alerts.push({ id: "heavy-rain", severity: "warning", title: "Heavy Rain", description: "Expect significant rainfall today.", outfitTip: "Waterproof shell, rain boots, and an umbrella are non-negotiable.", icon: "CloudRain", color: "text-blue-600", bgColor: "bg-blue-50 dark:bg-blue-950/30" });
  } else if (incomingHeavyRain) {
    alerts.push({ id: "incoming-rain", severity: "watch", title: "Heavy Rain Coming", description: "Heavy rain expected later today.", outfitTip: "Pack an umbrella. Water-resistant shoes and a light shell are smart today.", icon: "CloudRain", color: "text-blue-600", bgColor: "bg-blue-50 dark:bg-blue-950/30" });
  } else if (isRainLikely) {
    alerts.push({ id: "rain-likely", severity: "advisory", title: "Rain Likely", description: "There is a moderate chance of rain.", outfitTip: "Toss a compact umbrella in your bag. A light water-resistant layer is worth it.", icon: "Umbrella", color: "text-teal-600", bgColor: "bg-teal-50 dark:bg-teal-950/30" });
  }

  if (isHeavySnow) {
    alerts.push({ id: "heavy-snow", severity: "warning", title: "Snow / Blizzard", description: "Significant snowfall expected.", outfitTip: "Insulated waterproof boots, thermal base layers, and a weatherproof outer shell. Cover all exposed skin.", icon: "Snowflake", color: "text-sky-600", bgColor: "bg-sky-50 dark:bg-sky-950/30" });
  } else if (incomingSnow) {
    alerts.push({ id: "incoming-snow", severity: "watch", title: "Snow Moving In", description: "Snowfall expected later today.", outfitTip: "Layer up before heading out — waterproof boots and a warm outer shell are wise today.", icon: "Snowflake", color: "text-sky-600", bgColor: "bg-sky-50 dark:bg-sky-950/30" });
  }

  if (temperatureF >= 95) {
    alerts.push({ id: "extreme-heat", severity: "warning", title: "Extreme Heat", description: "Dangerously high temperatures.", outfitTip: "Ultra-light breathable fabrics only. Light colors. Sunscreen, hat, and sunglasses are essential.", icon: "Thermometer", color: "text-red-600", bgColor: "bg-red-50 dark:bg-red-950/30" });
  } else if (temperatureF <= 15) {
    alerts.push({ id: "extreme-cold", severity: "warning", title: "Extreme Cold", description: "Potentially dangerous temperatures.", outfitTip: "Full insulation from head to toe. No exposed skin. Prioritize warmth over style today.", icon: "Wind", color: "text-indigo-600", bgColor: "bg-indigo-50 dark:bg-indigo-950/30" });
  } else if (temperatureF >= 85 && humidity >= 70) {
    alerts.push({ id: "heat-humidity", severity: "advisory", title: "High Humidity", description: "Feels significantly hotter than the temperature suggests.", outfitTip: "Moisture-wicking fabrics only. Linen or technical meshes work best. Avoid dark colors.", icon: "Droplets", color: "text-orange-500", bgColor: "bg-orange-50 dark:bg-orange-950/30" });
  }

  if (isHighWind) {
    alerts.push({ id: "high-wind", severity: "watch", title: "High Wind Advisory", description: "Dangerous gusts expected.", outfitTip: "A fitted windproof layer is critical. Avoid loose or flowing clothing.", icon: "Wind", color: "text-orange-600", bgColor: "bg-orange-50 dark:bg-orange-950/30" });
  }

  const severityOrder = { warning: 3, watch: 2, advisory: 1 };
  alerts.sort((a, b) => severityOrder[b.severity] - severityOrder[a.severity]);

  return alerts.slice(0, 3);
}