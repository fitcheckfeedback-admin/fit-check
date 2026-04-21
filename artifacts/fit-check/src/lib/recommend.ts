import { StylePreference } from "./storage";
import { getWeatherInfo } from "./weather-codes";
import { HourlyForecast } from "./weather";

export interface RecommendationInput {
  temperatureF: number;
  feelsLikeF: number;
  precipChance: number;
  weatherCode: number;
  windMph: number;
  humidity: number;
  isDay: boolean;
  style: StylePreference;
}

export interface Recommendation {
  mainOutfit: string;
  outerwear?: string;
  accessories: string[];
  warnings: string[];
  fitScore: number;
}

export function generateRecommendation(input: RecommendationInput): Recommendation {
  let { temperatureF, precipChance, weatherCode, windMph, humidity, isDay, style } = input;

  // Nudge slightly warmer if it's night time
  if (!isDay) {
    temperatureF -= 5;
  }

  let mainOutfit = "";
  let outerwear: string | undefined = undefined;
  let accessories: string[] = [];
  let warnings: string[] = [];
  let fitScore = 100;

  const wmoInfo = getWeatherInfo(weatherCode);

  // Core temperature tiers
  if (temperatureF < 40) {
    mainOutfit = getStyleCopy("heavy coat, sweater, pants", style);
    outerwear = "Heavy coat";
    accessories.push("Closed-toe shoes");
    if (temperatureF < 25) {
      accessories.push("Beanie", "Gloves");
      warnings.push("Freezing temps. Layer up heavily.");
      fitScore -= 20;
    }
  } else if (temperatureF < 56) {
    mainOutfit = getStyleCopy("jacket, long sleeve, pants", style);
    outerwear = "Jacket or hoodie";
    accessories.push("Closed-toe shoes");
  } else if (temperatureF < 70) {
    mainOutfit = getStyleCopy("light long sleeve or tee, jeans", style);
    if (temperatureF < 62) outerwear = "Light layer";
    accessories.push("Sneakers");
  } else if (temperatureF < 81) {
    mainOutfit = getStyleCopy("tee, shorts", style);
    accessories.push("Sneakers or light shoes");
  } else {
    mainOutfit = getStyleCopy("tank or breathable shirt, shorts", style);
    accessories.push("Light shoes");
    warnings.push("Hot one today. Stay hydrated.");
    fitScore -= 10;
  }

  // Modifiers
  if (precipChance >= 60) {
    accessories.push("Umbrella", "Waterproof shoes");
    if (!outerwear) outerwear = "Rain jacket";
    warnings.push("Rain expected, grab an umbrella.");
    fitScore -= 15;
  } else if (precipChance >= 30) {
    warnings.push("Maybe bring an umbrella, chance of rain.");
    fitScore -= 5;
  }

  if (windMph >= 15 && temperatureF < 65) {
    warnings.push("It's breezy out there — consider a windbreaker.");
    if (!outerwear) outerwear = "Windbreaker";
    fitScore -= 10;
  }

  if (humidity >= 70 && temperatureF >= 75) {
    warnings.push("High humidity. Lightweight fabrics recommended.");
    fitScore -= 5;
  }

  if (wmoInfo.category === "thunderstorm") {
    warnings.push("Strong thunderstorm warning. Stay dry.");
    accessories.push("Sturdy waterproof gear");
    fitScore -= 20;
  }

  if (wmoInfo.category === "snow") {
    warnings.push("Snowy conditions. Boots are a must.");
    accessories.push("Winter boots");
    if (!outerwear) outerwear = "Heavy winter coat";
    fitScore -= 15;
  }

  fitScore = Math.max(0, Math.min(100, fitScore));

  return { mainOutfit, outerwear, accessories, warnings, fitScore };
}

function getStyleCopy(base: string, style: StylePreference): string {
  const map: Record<string, Record<StylePreference, string>> = {
    "heavy coat, sweater, pants": {
      Casual: "A comfy sweater, heavy coat, and your favorite pants.",
      Streetwear: "Oversized hoodie under a puffer jacket with cargo pants.",
      Athletic: "Thermal base layers, fleece, and weather-resistant joggers.",
      Workwear: "Heavy duty canvas jacket over a thick flannel and tough denim.",
      Minimal: "Monochrome wool sweater, tailored coat, and structured trousers."
    },
    "jacket, long sleeve, pants": {
      Casual: "A long sleeve tee, a solid jacket, and everyday pants.",
      Streetwear: "Graphic long sleeve, bomber jacket, and relaxed denim.",
      Athletic: "Track jacket over a performance tee with joggers.",
      Workwear: "Chore coat, thermal henley, and durable pants.",
      Minimal: "Clean jacket over a simple crewneck and neat slacks."
    },
    "light long sleeve or tee, jeans": {
      Casual: "A light long sleeve or tee paired with comfortable jeans.",
      Streetwear: "Vintage tee, optional overshirt, and baggy jeans.",
      Athletic: "Athleisure long sleeve and training pants.",
      Workwear: "Sturdy button-down and classic denim.",
      Minimal: "Crisp white tee, light cardigan, and slim jeans."
    },
    "tee, shorts": {
      Casual: "A simple t-shirt and your go-to shorts.",
      Streetwear: "Boxy tee, stylish shorts, and statement sneakers.",
      Athletic: "Moisture-wicking tee and athletic shorts.",
      Workwear: "Short sleeve work shirt and durable canvas shorts.",
      Minimal: "Fitted basic tee and tailored shorts."
    },
    "tank or breathable shirt, shorts": {
      Casual: "A breezy tank or shirt and light shorts.",
      Streetwear: "Mesh jersey or tank, nylon shorts, and fresh kicks.",
      Athletic: "Performance tank and running shorts.",
      Workwear: "Lightweight button-up and functional shorts.",
      Minimal: "Linen blend shirt and simple shorts."
    }
  };

  return map[base]?.[style] || base;
}

function average(arr: number[]): number {
  if (!arr || arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

export function generateTimeOfDayRecs(
  hourlyForecast: HourlyForecast, 
  style: StylePreference, 
  units: "f" | "c"
) {
  // Extract today's hourly data starting from current time
  const now = new Date();
  
  // Find indices for morning (6-11), afternoon (12-17), evening (18-22)
  // Simple approach: get the next 24 hours and bucket them
  const indices = {
    morning: [] as number[],
    afternoon: [] as number[],
    evening: [] as number[]
  };

  hourlyForecast.time.slice(0, 24).forEach((timeStr, i) => {
    const hour = new Date(timeStr).getHours();
    if (hour >= 6 && hour < 12) indices.morning.push(i);
    else if (hour >= 12 && hour < 18) indices.afternoon.push(i);
    else if (hour >= 18 && hour < 23) indices.evening.push(i);
  });

  const createRec = (idxs: number[]) => {
    if (idxs.length === 0) return generateRecommendation({
      temperatureF: hourlyForecast.temperature_2m[0],
      feelsLikeF: hourlyForecast.apparent_temperature[0],
      precipChance: hourlyForecast.precipitation_probability[0],
      weatherCode: hourlyForecast.weather_code[0],
      windMph: hourlyForecast.wind_speed_10m[0],
      humidity: hourlyForecast.relative_humidity_2m[0],
      isDay: true,
      style
    });

    const temp = average(idxs.map(i => hourlyForecast.temperature_2m[i]));
    const feels = average(idxs.map(i => hourlyForecast.apparent_temperature[i]));
    const precip = Math.max(...idxs.map(i => hourlyForecast.precipitation_probability[i]));
    const wind = average(idxs.map(i => hourlyForecast.wind_speed_10m[i]));
    const hum = average(idxs.map(i => hourlyForecast.relative_humidity_2m[i]));
    
    // Most common weather code in the bucket
    const codes = idxs.map(i => hourlyForecast.weather_code[i]);
    const codeMap = codes.reduce((acc, c) => { acc[c] = (acc[c] || 0) + 1; return acc; }, {} as Record<number, number>);
    let maxCode = codes[0];
    let maxCount = 0;
    for (const [code, count] of Object.entries(codeMap)) {
      if (count > maxCount) {
        maxCount = count;
        maxCode = Number(code);
      }
    }

    // Determine isDay simply by hour
    const hourAvg = average(idxs.map(i => new Date(hourlyForecast.time[i]).getHours()));
    const isDay = hourAvg >= 6 && hourAvg <= 18;

    return generateRecommendation({
      temperatureF: temp,
      feelsLikeF: feels,
      precipChance: precip,
      weatherCode: maxCode,
      windMph: wind,
      humidity: hum,
      isDay,
      style
    });
  };

  return {
    morning: createRec(indices.morning),
    afternoon: createRec(indices.afternoon),
    evening: createRec(indices.evening)
  };
}
