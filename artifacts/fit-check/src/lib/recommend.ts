import { StylePreference, GenderPreference } from "./storage";
import { getWeatherInfo } from "./weather-codes";
import { HourlyForecast } from "./weather";
import { WeatherAlert, detectAlerts } from "./weatherAlerts";

export interface RecommendationInput {
  temperatureF: number;
  feelsLikeF: number;
  precipChance: number;
  weatherCode: number;
  windMph: number;
  humidity: number;
  isDay: boolean;
  style: StylePreference;
  gender?: GenderPreference;
}

export interface Recommendation {
  mainOutfit: string;
  outerwear?: string;
  accessories: string[];
  warnings: string[];
  fitScore: number;
  alerts: WeatherAlert[];
}

function getRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generateRecommendation(input: RecommendationInput): Recommendation {
  let { temperatureF, precipChance, weatherCode, windMph, humidity, isDay, style, gender = "unspecified" } = input;

  if (!isDay) {
    temperatureF -= 5;
  }

  let mainOutfit = "";
  let outerwear: string | undefined = undefined;
  let accessories: string[] = [];
  let warnings: string[] = [];
  let fitScore = 100;

  const wmoInfo = getWeatherInfo(weatherCode);

  if (temperatureF < 40) {
    mainOutfit = getStyleCopy("heavy coat, sweater, pants", style, gender);
    outerwear = gender === "female"
      ? getRandom(["A heavy wrap coat", "Thick wool overcoat", "Insulated puffer coat"])
      : getRandom(["A heavy parka", "Thick winter coat", "Insulated jacket"]);
    accessories.push("Warm socks", gender === "female" ? "Ankle or knee-high boots" : "Sturdy shoes");
    if (temperatureF < 25) {
      accessories.push("Beanie", "Gloves", "Scarf");
      warnings.push("Bitterly cold. Layer up heavily to stay safe.");
      fitScore -= 20;
    } else {
      warnings.push("Pretty chilly out there. Keep wrapped up.");
    }
  } else if (temperatureF < 56) {
    mainOutfit = getStyleCopy("jacket, long sleeve, pants", style, gender);
    outerwear = gender === "female"
      ? getRandom(["A denim jacket or blazer", "Your favorite cardigan", "A chic mid-layer"])
      : getRandom(["A dependable jacket", "Your favorite hoodie", "A solid mid-layer"]);
    accessories.push(gender === "female" ? "Ankle boots or clean sneakers" : "Closed-toe shoes");
  } else if (temperatureF < 70) {
    mainOutfit = getStyleCopy("light long sleeve or tee, jeans", style, gender);
    if (temperatureF < 62) outerwear = gender === "female" ? "Light cardigan or denim jacket" : "Light overshirt or cardigan";
    accessories.push("Sneakers");
  } else if (temperatureF < 81) {
    mainOutfit = getStyleCopy("tee, shorts", style, gender);
    accessories.push(gender === "female" ? "Clean sneakers or sandals" : "Comfortable sneakers");
  } else {
    mainOutfit = getStyleCopy("tank or breathable shirt, shorts", style, gender);
    accessories.push(gender === "female" ? "Sandals or lightweight sneakers" : "Breathable shoes or sandals");
    warnings.push("It's getting hot. Remember to hydrate.");
    if (isDay) accessories.push("Sunglasses");
    fitScore -= 10;
  }

  if (precipChance >= 60) {
    accessories.push("Umbrella", "Water-resistant shoes");
    if (!outerwear) outerwear = "Light rain jacket";
    warnings.push("High chance of rain. Don't get caught without cover.");
    fitScore -= 15;
  } else if (precipChance >= 30) {
    warnings.push("Might sprinkle later. An umbrella wouldn't hurt.");
    fitScore -= 5;
  }

  if (windMph >= 15 && temperatureF < 65) {
    warnings.push("It's pretty breezy. A windbreaker could save the day.");
    if (!outerwear) outerwear = "Windbreaker";
    fitScore -= 10;
  }

  if (humidity >= 70 && temperatureF >= 75) {
    warnings.push("It's quite muggy. Stick to lightweight, breathable fabrics.");
    fitScore -= 5;
  }

  if (wmoInfo.category === "thunderstorm") {
    warnings.push("Storms rolling in. Stay indoors if you can, or pack serious rain gear.");
    accessories.push("Waterproof jacket");
    fitScore -= 20;
  }

  if (wmoInfo.category === "snow") {
    warnings.push("Snow on the ground. Proper footwear is essential.");
    accessories.push("Winter boots");
    if (!outerwear) outerwear = "Heavy winter coat";
    fitScore -= 15;
  }

  fitScore = Math.max(0, Math.min(100, fitScore));

  const alerts = detectAlerts(input);

  return { mainOutfit, outerwear, accessories, warnings, fitScore, alerts };
}

function getStyleCopy(base: string, style: StylePreference, gender: GenderPreference = "unspecified"): string {
  const femaleMap: Record<string, Record<StylePreference, string[]>> = {
    "heavy coat, sweater, pants": {
      Casual: [
        "A chunky oversized sweater, warm leggings, and your coziest coat.",
        "A heavy knit cardigan layered over a long sleeve with thermal leggings."
      ],
      Streetwear: [
        "Oversized puffer coat, a graphic hoodie, and wide-leg cargo pants.",
        "A bold oversized jacket over a crewneck and baggy joggers."
      ],
      Athletic: [
        "A high-neck fleece, thermal running tights, and a heavy athletic jacket.",
        "Warm base layer, insulated leggings, and a performance puffer."
      ],
      Workwear: [
        "A structured wool coat over a turtleneck blouse and tailored trousers.",
        "A belted heavy coat over a silk blouse and wide-leg work trousers."
      ],
      Minimal: [
        "A long structured topcoat over a fine merino turtleneck and slim trousers.",
        "Monochromatic wool sweater with tailored pants and a wrap coat."
      ]
    },
    "jacket, long sleeve, pants": {
      Casual: [
        "A denim jacket or cardigan over a long sleeve tee and comfortable jeans.",
        "Your favorite jacket layered over a simple long sleeve and relaxed jeans."
      ],
      Streetwear: [
        "A cropped bomber over a vintage tee and wide-leg denim.",
        "Oversized zip-up hoodie, graphic long sleeve, and trendy cargo pants."
      ],
      Athletic: [
        "A fitted track jacket and high-waist athletic leggings.",
        "A performance zip-up with seamless athletic pants."
      ],
      Workwear: [
        "A blazer over a silk blouse and tailored straight pants.",
        "A structured blazer, crisp button-down blouse, and wide-leg trousers."
      ],
      Minimal: [
        "A clean longline cardigan over a simple scoop neck and tailored pants.",
        "A sleek unbranded jacket, fitted top, and straight-cut trousers."
      ]
    },
    "light long sleeve or tee, jeans": {
      Casual: [
        "A flowy blouse or everyday tee with your go-to jeans or leggings.",
        "A light long sleeve tucked into comfortable high-waist jeans."
      ],
      Streetwear: [
        "An oversized vintage tee, optional flannel, and perfectly distressed jeans.",
        "A boxy graphic tee with high-waist wide-leg jeans and clean sneakers."
      ],
      Athletic: [
        "A moisture-wicking long sleeve and high-waist athletic leggings.",
        "A racerback top with flexible training tights."
      ],
      Workwear: [
        "A light button-down blouse tucked into straight-cut tailored trousers.",
        "A refined blouse and tailored ankle pants."
      ],
      Minimal: [
        "A crisp fitted tee, a light cardigan if needed, and slim dark jeans.",
        "A premium fitted tee and tailored high-waist jeans."
      ]
    },
    "tee, shorts": {
      Casual: [
        "A soft tee and casual shorts, or an easy breezy midi skirt.",
        "A simple tee with relaxed shorts or a flowy skirt."
      ],
      Streetwear: [
        "A crop top, cuffed denim shorts, and chunky sneakers.",
        "A graphic crop tee with biker shorts and bold kicks."
      ],
      Athletic: [
        "A breathable sports crop top and running shorts or bike shorts.",
        "A moisture-wicking training tank and athletic shorts."
      ],
      Workwear: [
        "A lightweight shell blouse and tailored bermuda shorts.",
        "A flowy linen button-down and crisp city shorts."
      ],
      Minimal: [
        "A clean fitted crop tee and structured shorts or a simple midi skirt.",
        "A monochromatic short sleeve and minimalist high-waist shorts."
      ]
    },
    "tank or breathable shirt, shorts": {
      Casual: [
        "A breezy sundress or a thin tank with breathable shorts.",
        "The lightest flowy dress or an easy tank and loose shorts."
      ],
      Streetwear: [
        "A mesh top or barely-there tank, bike shorts, and minimalist sneakers.",
        "An oversized thin tee knotted at the waist with lightweight shorts."
      ],
      Athletic: [
        "A high-performance cooling crop tank and ultralight running shorts.",
        "A barely-there sports bra and minimal running shorts."
      ],
      Workwear: [
        "A sleeveless linen blouse and tailored wide-leg shorts.",
        "A light chambray sleeveless top and flowy utility shorts."
      ],
      Minimal: [
        "A clean linen sundress or a simple tank with minimal structured shorts.",
        "A fine cotton sundress or a linen tank and crisp shorts."
      ]
    }
  };

  if (gender === "female") {
    const options = femaleMap[base]?.[style];
    return options ? getRandom(options) : base;
  }

  const map: Record<string, Record<StylePreference, string[]>> = {
    "heavy coat, sweater, pants": {
      Casual: [
        "Throw on your chunkiest sweater, a heavy coat, and some reliable pants.",
        "A thick knit sweater under your warmest coat with everyday pants."
      ],
      Streetwear: [
        "Massive puffer jacket over a heavy hoodie and baggy cargo pants.",
        "Oversized heavy outerwear layered with a graphic hoodie and wide pants."
      ],
      Athletic: [
        "Thermal base layers under a heavy fleece and weather-resistant joggers.",
        "Insulated performance jacket with thick track pants."
      ],
      Workwear: [
        "Heavy canvas jacket lined with fleece, over a thick flannel and tough denim.",
        "Rugged winter coat over a heavyweight henley and reinforced pants."
      ],
      Minimal: [
        "A structured tailored coat over a monochrome wool sweater and clean trousers.",
        "Heavy minimal topcoat with a fine knit turtleneck and wool trousers."
      ]
    },
    "jacket, long sleeve, pants": {
      Casual: [
        "A comfortable long sleeve tee, a solid jacket, and everyday pants.",
        "Your favorite jacket over a simple long sleeve and jeans."
      ],
      Streetwear: [
        "A bold bomber or varsity jacket over a graphic long sleeve and relaxed denim.",
        "Layer a zip-up over a heavyweight vintage long sleeve and baggy jeans."
      ],
      Athletic: [
        "Sleek track jacket over a performance long sleeve and fitted joggers.",
        "A technical zip-up with breathable athletic pants."
      ],
      Workwear: [
        "A classic chore coat over a thermal henley and durable canvas pants.",
        "Tough utility jacket over a chambray shirt and sturdy jeans."
      ],
      Minimal: [
        "A clean, unbranded jacket over a simple crewneck and neat slacks.",
        "Minimalist zip jacket with a crisp long sleeve and straight trousers."
      ]
    },
    "light long sleeve or tee, jeans": {
      Casual: [
        "A light long sleeve or classic tee paired with comfortable jeans.",
        "Just a simple tee or henley with your go-to pair of jeans."
      ],
      Streetwear: [
        "A vintage graphic tee, an optional flannel, and perfectly bagged jeans.",
        "Oversized boxy tee with wide-leg denim and statement sneakers."
      ],
      Athletic: [
        "A moisture-wicking long sleeve and flexible training pants.",
        "Performance quarter-zip with tapered athletic joggers."
      ],
      Workwear: [
        "A sturdy button-down shirt tucked into classic raw denim.",
        "A heavyweight pocket tee and double-knee work pants."
      ],
      Minimal: [
        "A crisp white tee, a light cardigan if needed, and slim jeans.",
        "A perfectly fitted premium t-shirt and tailored dark denim."
      ]
    },
    "tee, shorts": {
      Casual: [
        "A soft, simple t-shirt and your most comfortable shorts.",
        "Your favorite everyday tee paired with casual shorts."
      ],
      Streetwear: [
        "A heavyweight boxy tee, stylish shorts, and fresh sneakers.",
        "Graphic tee, nylon shorts, and a bold pair of kicks."
      ],
      Athletic: [
        "A breathable performance tee and athletic shorts.",
        "Moisture-wicking training shirt and lightweight gym shorts."
      ],
      Workwear: [
        "A short sleeve work shirt and durable canvas shorts.",
        "Tough pocket t-shirt and reinforced utility shorts."
      ],
      Minimal: [
        "A fitted basic tee and cleanly tailored shorts.",
        "A monochromatic short sleeve and simple, unbranded shorts."
      ]
    },
    "tank or breathable shirt, shorts": {
      Casual: [
        "A breezy tank or light shirt and breathable shorts.",
        "The lightest tee or tank you own and easy shorts."
      ],
      Streetwear: [
        "A mesh jersey or relaxed tank, lightweight shorts, and clean sneakers.",
        "Oversized breathable tee with athletic mesh shorts."
      ],
      Athletic: [
        "A high-performance cooling tank and running shorts.",
        "Ultralight training tank top and minimal athletic shorts."
      ],
      Workwear: [
        "A lightweight, breathable button-up and functional shorts.",
        "A light chambray short sleeve and utility work shorts."
      ],
      Minimal: [
        "A linen blend shirt and simple, structured shorts.",
        "A fine cotton tank and crisp, minimalist shorts."
      ]
    }
  };

  const options = map[base]?.[style];
  return options ? getRandom(options) : base;
}

function average(arr: number[]): number {
  if (!arr || arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

export function generateTimeOfDayRecs(
  hourlyForecast: HourlyForecast, 
  style: StylePreference, 
  units: "f" | "c",
  gender: GenderPreference = "unspecified"
) {
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
      style,
      gender
    });

    const temp = average(idxs.map(i => hourlyForecast.temperature_2m[i]));
    const feels = average(idxs.map(i => hourlyForecast.apparent_temperature[i]));
    const precip = Math.max(...idxs.map(i => hourlyForecast.precipitation_probability[i]));
    const wind = average(idxs.map(i => hourlyForecast.wind_speed_10m[i]));
    const hum = average(idxs.map(i => hourlyForecast.relative_humidity_2m[i]));
    
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
      style,
      gender
    });
  };

  return {
    morning: createRec(indices.morning),
    afternoon: createRec(indices.afternoon),
    evening: createRec(indices.evening)
  };
}
