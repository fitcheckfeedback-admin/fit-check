import { VoiceIntent } from "./voiceIntent";
import { Recommendation } from "./recommend";
import { WeatherForecastResponse } from "./weather";
import { FitCheckSettings } from "./storage";
import { getWeatherInfo } from "./weather-codes";

export function buildVoiceAnswer(
  intent: VoiceIntent,
  weatherData: WeatherForecastResponse,
  recommendation: Recommendation,
  settings: FitCheckSettings
): string {
  const t = (temp: number) => {
    const val = settings.units === "c" ? Math.round(((temp - 32) * 5) / 9) : Math.round(temp);
    return `${val} degrees${settings.units === "c" ? " Celsius" : ""}`;
  };

  const { current, hourly, daily } = weatherData;
  const currentTemp = t(current.temperature_2m);
  const currentCondition = getWeatherInfo(current.weather_code).label.toLowerCase();
  const maxPrecip = Math.max(...hourly.precipitation_probability.slice(0, 24));
  
  const outf = recommendation.mainOutfit.replace(/, /g, " and ").toLowerCase();
  const outer = recommendation.outerwear ? ` Throw on ${recommendation.outerwear.toLowerCase()}.` : "";
  const accs = recommendation.accessories.length > 0 ? ` Don't forget ${recommendation.accessories.join(" and ").toLowerCase()}.` : "";

  switch (intent.type) {
    case "tomorrow": {
      const tmrwTempMax = t(daily.temperature_2m_max[1]);
      const tmrwCondition = getWeatherInfo(daily.weather_code[1]).label.toLowerCase();
      return `Tomorrow looks like ${tmrwTempMax} and ${tmrwCondition}. A good idea would be ${outf}.${outer}${accs}`;
    }
    
    case "rain": {
      if (maxPrecip > 30) {
        return `There is a ${maxPrecip} percent chance of rain today. You should wear a rain jacket, waterproof shoes, and bring an umbrella.`;
      }
      return `It doesn't look like much rain today, just a ${maxPrecip} percent chance. ${recommendation.mainOutfit} should be fine.`;
    }
    
    case "warmth": {
      if (current.temperature_2m < 50) {
        return `It's chilly out there, currently ${currentTemp}. Layer up with ${outf}.${outer}${accs}`;
      } else if (current.temperature_2m > 80) {
        return `It's pretty warm today at ${currentTemp}. Keep it light with ${outf}.`;
      }
      return `The temperature is comfortable at ${currentTemp}. ${recommendation.mainOutfit} is a great choice.`;
    }
    
    case "morning":
    case "afternoon":
    case "evening": {
      return `For this ${intent.type}, expect around ${currentTemp} and ${currentCondition}. You'll be set with ${outf}.${outer}`;
    }
    
    case "today":
    default: {
      let rainWarn = "";
      if (maxPrecip > 30) rainWarn = ` Maybe grab an umbrella, there's a ${maxPrecip} percent chance of rain later.`;
      
      return `It's ${currentTemp} and ${currentCondition} in ${settings.location?.name || "your area"}. Today's fit: ${outf}.${outer}${accs}${rainWarn}`;
    }
  }
}
