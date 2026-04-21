export type WeatherCategory = 
  | "clear" 
  | "partly-cloudy" 
  | "cloudy" 
  | "fog" 
  | "drizzle" 
  | "rain" 
  | "snow" 
  | "showers" 
  | "thunderstorm";

export interface WeatherCodeInfo {
  label: string;
  icon: string;
  category: WeatherCategory;
}

export const WEATHER_CODES: Record<number, WeatherCodeInfo> = {
  0: { label: "Clear sky", icon: "Sun", category: "clear" },
  1: { label: "Mainly clear", icon: "CloudSun", category: "partly-cloudy" },
  2: { label: "Partly cloudy", icon: "CloudSun", category: "partly-cloudy" },
  3: { label: "Overcast", icon: "Cloud", category: "cloudy" },
  45: { label: "Fog", icon: "CloudFog", category: "fog" },
  48: { label: "Depositing rime fog", icon: "CloudFog", category: "fog" },
  51: { label: "Light drizzle", icon: "CloudDrizzle", category: "drizzle" },
  53: { label: "Moderate drizzle", icon: "CloudDrizzle", category: "drizzle" },
  55: { label: "Dense drizzle", icon: "CloudDrizzle", category: "drizzle" },
  56: { label: "Light freezing drizzle", icon: "CloudDrizzle", category: "drizzle" },
  57: { label: "Dense freezing drizzle", icon: "CloudDrizzle", category: "drizzle" },
  61: { label: "Slight rain", icon: "CloudRain", category: "rain" },
  63: { label: "Moderate rain", icon: "CloudRain", category: "rain" },
  65: { label: "Heavy rain", icon: "CloudRain", category: "rain" },
  66: { label: "Light freezing rain", icon: "CloudRain", category: "rain" },
  67: { label: "Heavy freezing rain", icon: "CloudRain", category: "rain" },
  71: { label: "Slight snow fall", icon: "CloudSnow", category: "snow" },
  73: { label: "Moderate snow fall", icon: "CloudSnow", category: "snow" },
  75: { label: "Heavy snow fall", icon: "CloudSnow", category: "snow" },
  77: { label: "Snow grains", icon: "CloudSnow", category: "snow" },
  80: { label: "Slight rain showers", icon: "CloudRain", category: "showers" },
  81: { label: "Moderate rain showers", icon: "CloudRain", category: "showers" },
  82: { label: "Violent rain showers", icon: "CloudRain", category: "showers" },
  85: { label: "Slight snow showers", icon: "CloudSnow", category: "snow" },
  86: { label: "Heavy snow showers", icon: "CloudSnow", category: "snow" },
  95: { label: "Thunderstorm", icon: "CloudLightning", category: "thunderstorm" },
  96: { label: "Thunderstorm with slight hail", icon: "CloudLightning", category: "thunderstorm" },
  99: { label: "Thunderstorm with heavy hail", icon: "CloudLightning", category: "thunderstorm" }
};

export function getWeatherInfo(code: number): WeatherCodeInfo {
  return WEATHER_CODES[code] || { label: "Unknown", icon: "Cloud", category: "cloudy" };
}
