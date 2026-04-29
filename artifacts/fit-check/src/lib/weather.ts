export interface CitySearchResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  admin1?: string; // State/Province
}

export interface CurrentWeather {
  time: string;
  temperature_2m: number;
  relative_humidity_2m: number;
  apparent_temperature: number;
  is_day: number;
  precipitation: number;
  rain: number;
  showers: number;
  snowfall: number;
  weather_code: number;
  wind_speed_10m: number;
  wind_gusts_10m: number;
}

export interface HourlyForecast {
  time: string[];
  temperature_2m: number[];
  apparent_temperature: number[];
  precipitation_probability: number[];
  weather_code: number[];
  wind_speed_10m: number[];
  relative_humidity_2m: number[];
}

export interface DailyForecast {
  time: string[];
  weather_code: number[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
  precipitation_probability_max: number[];
  sunrise: string[];
  sunset: string[];
}

export interface WeatherForecastResponse {
  latitude: number;
  longitude: number;
  timezone: string;
  current: CurrentWeather;
  hourly: HourlyForecast;
  daily: DailyForecast;
}

export async function searchCity(query: string): Promise<CitySearchResult[]> {
  if (!query || query.length < 2) return [];
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to search city");
  const data = await res.json();
  return data.results || [];
}

export async function fetchForecast(lat: number, lon: number): Promise<WeatherForecastResponse> {
  const currentFields = [
    "temperature_2m", "relative_humidity_2m", "apparent_temperature",
    "is_day", "precipitation", "rain", "showers", "snowfall",
    "weather_code", "wind_speed_10m", "wind_gusts_10m",
  ].join(",");
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=${currentFields}&hourly=temperature_2m,apparent_temperature,precipitation_probability,weather_code,wind_speed_10m,relative_humidity_2m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=auto&forecast_days=5`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch weather forecast");
  return res.json();
}

export interface TripDayForecast {
  date: string;
  weatherCode: number;
  highF: number;
  lowF: number;
  avgF: number;
  precipChance: number;
  sunrise: string;
  sunset: string;
}

export async function reverseGeocode(lat: number, lon: number): Promise<string | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10`,
      { headers: { "Accept-Language": "en" } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const a = data.address ?? {};
    const city = a.city || a.town || a.village || a.suburb || a.county || "";
    const stateCode = a.state_code || "";
    const stateName = a.state || "";
    const country = a.country || "";
    const isUS = a.country_code === "us";

    if (city && isUS && stateCode) return `${city}, ${stateCode}`;
    if (city && isUS && stateName) return `${city}, ${stateName}`;
    if (city && country) return `${city}, ${country}`;
    if (city) return city;
    if (stateName && country) return `${stateName}, ${country}`;
    return null;
  } catch {
    return null;
  }
}

export async function fetchTripForecast(lat: number, lon: number, startDate: string, endDate: string): Promise<TripDayForecast[]> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=auto&start_date=${startDate}&end_date=${endDate}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch trip forecast");
  const data = await res.json();
  return (data.daily.time as string[]).map((date: string, i: number) => ({
    date,
    weatherCode: data.daily.weather_code[i],
    highF: data.daily.temperature_2m_max[i],
    lowF: data.daily.temperature_2m_min[i],
    avgF: (data.daily.temperature_2m_max[i] + data.daily.temperature_2m_min[i]) / 2,
    precipChance: data.daily.precipitation_probability_max[i] ?? 0,
    sunrise: data.daily.sunrise[i] ?? "",
    sunset: data.daily.sunset[i] ?? "",
  }));
}
