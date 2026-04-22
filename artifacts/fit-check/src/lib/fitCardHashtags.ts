import { StylePreference, WeatherTag } from "./storage";
import { WeatherAlert } from "./weatherAlerts";

export function generateHashtags(params: { style: StylePreference, weatherTags: WeatherTag[], alerts: WeatherAlert[], location?: string }): string[] {
  const tags = new Set<string>();
  
  // Core
  ["#FitCheck", "#OOTD", "#OutfitOfTheDay", "#DailyFit", "#FashionInspo", "#StyleInspo"].forEach(t => tags.add(t));
  
  // Weather
  if (params.weatherTags.includes("hot") || params.weatherTags.includes("warm")) {
    ["#SummerFit", "#SummerStyle", "#GRWM"].forEach(t => tags.add(t));
  }
  if (params.weatherTags.includes("cool") || params.weatherTags.includes("cold")) {
    ["#WinterFit", "#WinterStyle", "#LayeredLook"].forEach(t => tags.add(t));
  }
  if (params.weatherTags.includes("rainy")) {
    ["#RainyDayFit", "#RainyDayOutfit"].forEach(t => tags.add(t));
  }
  if (params.weatherTags.includes("snowy")) {
    ["#WinterLooks", "#SnowDay"].forEach(t => tags.add(t));
  }
  if (params.weatherTags.includes("sunny")) {
    ["#SunnyDayVibes", "#SunnyOutfit"].forEach(t => tags.add(t));
  }
  if (params.weatherTags.includes("stormy")) {
    ["#StormReady", "#WeatherFashion"].forEach(t => tags.add(t));
  }
  
  // Style
  switch(params.style) {
    case "Casual":
      ["#CasualFit", "#CasualStyle", "#CasualOutfit"].forEach(t => tags.add(t)); break;
    case "Streetwear":
      ["#Streetwear", "#StreetStyle", "#UrbanFashion"].forEach(t => tags.add(t)); break;
    case "Athletic":
      ["#AthleticWear", "#AthleisureFit", "#GymFit"].forEach(t => tags.add(t)); break;
    case "Workwear":
      ["#Workwear", "#WorkFit", "#ProfessionalStyle"].forEach(t => tags.add(t)); break;
    case "Minimal":
      ["#MinimalFashion", "#MinimalistStyle", "#CleanAesthetic"].forEach(t => tags.add(t)); break;
  }
  
  ["#FitCheckApp", "#WeatherFit", "#GetDressed"].forEach(t => tags.add(t));
  
  return Array.from(tags).slice(0, 15);
}

export function formatHashtagsForShare(tags: string[]): string {
  return tags.join(" ");
}
