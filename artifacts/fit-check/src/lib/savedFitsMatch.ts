import { RecommendationInput } from "./recommend";
import { SavedFit, WeatherTag } from "./storage";

export function getWeatherTags(input: RecommendationInput): WeatherTag[] {
  const tags: WeatherTag[] = [];
  const { temperatureF, precipChance, weatherCode, windMph } = input;

  if (temperatureF >= 80) tags.push("hot");
  else if (temperatureF >= 70) tags.push("warm");
  else if (temperatureF >= 60) tags.push("mild");
  else if (temperatureF >= 50) tags.push("cool");
  else tags.push("cold");

  if (precipChance >= 50) tags.push("rainy");
  
  if (weatherCode >= 71 && weatherCode <= 79) tags.push("snowy");
  if (weatherCode >= 95 && weatherCode <= 99) tags.push("stormy");
  
  if (windMph >= 15) tags.push("windy");
  
  if (weatherCode === 0 || weatherCode === 1) tags.push("sunny");

  return tags;
}

export function matchSavedFits(savedFits: SavedFit[], currentTags: WeatherTag[]): SavedFit[] {
  return savedFits
    .filter(fit => fit.weatherTags.some(tag => currentTags.includes(tag)))
    .sort((a, b) => b.savedAt - a.savedAt)
    .slice(0, 3);
}
