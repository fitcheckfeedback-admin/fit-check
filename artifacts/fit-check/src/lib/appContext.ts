import { FitCheckSettings, ClosetData, ClosetItem } from "./storage";
import { WeatherForecastResponse } from "./weather";
import { getWeatherInfo } from "./weather-codes";

/**
 * Shared builder for the AI chat context sent to POST /api/ai/chat.
 * The backend's system prompt already knows how to answer questions about
 * the user's closet from `closetItems` — the voice assistant just never
 * sent it. Both the voice assistant and the stylist chat use this shape.
 */
export interface AiChatContext {
  weather?: {
    tempF: number;
    feelsLikeF: number;
    condition: string;
    windMph: number;
    precipChance: number;
    isDay: boolean;
  };
  closetItems?: { name: string; category: string }[];
  style?: string;
  gender?: string;
  pastOutfits?: string[];
}

export function flattenCloset(closet: ClosetData): { name: string; category: string }[] {
  const out: { name: string; category: string }[] = [];
  (Object.entries(closet) as [string, ClosetItem[]][]).forEach(([category, items]) => {
    for (const item of items) {
      out.push({ name: item.name, category });
    }
  });
  return out;
}

export function buildAiContext(
  settings: FitCheckSettings,
  weatherData: WeatherForecastResponse | null
): AiChatContext {
  const ctx: AiChatContext = {
    closetItems: flattenCloset(settings.closet),
    style: settings.style,
    gender: settings.gender,
    pastOutfits: settings.savedFits
      .slice(0, 5)
      .map((f) => `${f.label}: ${f.mainOutfit}${f.outerwear ? ` + ${f.outerwear}` : ""}`),
  };

  if (weatherData) {
    const { current, hourly } = weatherData;
    const maxPrecip = hourly.precipitation_probability.length
      ? Math.max(...hourly.precipitation_probability.slice(0, 24))
      : 0;
    ctx.weather = {
      tempF: current.temperature_2m,
      feelsLikeF: current.apparent_temperature,
      condition: getWeatherInfo(current.weather_code).label,
      windMph: current.wind_speed_10m,
      precipChance: maxPrecip,
      isDay: current.is_day === 1,
    };
  }

  return ctx;
}
