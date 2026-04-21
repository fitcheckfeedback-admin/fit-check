import { useFitCheckSettings } from "@/hooks/useFitCheckSettings";
import { useWeather } from "@/hooks/useWeather";
import { TempDisplay } from "@/components/TempDisplay";
import { WeatherIcon } from "@/components/WeatherIcon";
import { OutfitCard } from "@/components/OutfitCard";
import { TimeOfDayTabs } from "@/components/TimeOfDayTabs";
import { generateRecommendation, generateTimeOfDayRecs } from "@/lib/recommend";
import { getWeatherInfo } from "@/lib/weather-codes";
import { Loader2, MapPin, Droplets } from "lucide-react";
import { motion } from "framer-motion";
import { formatTemp } from "@/lib/format";

export default function Home() {
  const { settings } = useFitCheckSettings();
  const { data: weather, isLoading, isError } = useWeather(settings.location);

  if (isLoading || !weather) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 h-[80vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary/50" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-muted-foreground">
        <p>Failed to load weather data.</p>
      </div>
    );
  }

  const wmoInfo = getWeatherInfo(weather.current.weather_code);
  const todayRec = generateRecommendation({
    temperatureF: weather.current.temperature_2m,
    feelsLikeF: weather.current.apparent_temperature,
    precipChance: weather.hourly.precipitation_probability[0],
    weatherCode: weather.current.weather_code,
    windMph: weather.current.wind_speed_10m,
    humidity: weather.current.relative_humidity_2m,
    isDay: weather.current.is_day === 1,
    style: settings.style
  });

  const timeOfDayRecs = generateTimeOfDayRecs(weather.hourly, settings.style, settings.units);

  // Match closet
  const allRecWords = `${todayRec.mainOutfit} ${todayRec.outerwear || ""}`.toLowerCase();
  const closetMatches: string[] = [];
  
  const allClosetItems = [
    ...settings.closet.tops,
    ...settings.closet.bottoms,
    ...settings.closet.outerwear,
    ...settings.closet.shoes
  ];

  allClosetItems.forEach(item => {
    const words = item.toLowerCase().split(/\s+/);
    if (words.some(w => allRecWords.includes(w))) {
      closetMatches.push(item);
    }
  });

  const highF = weather.daily.temperature_2m_max[0];
  const lowF = weather.daily.temperature_2m_min[0];
  const precip = weather.hourly.precipitation_probability[0];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-6 space-y-8"
    >
      <header className="flex flex-col items-center text-center space-y-1">
        <div className="flex items-center text-muted-foreground font-medium text-sm">
          <MapPin className="w-4 h-4 mr-1" />
          {settings.location?.name || "Current Location"}
        </div>
        
        <div className="flex items-center justify-center gap-4 mt-4">
          <WeatherIcon category={wmoInfo.category} className="w-16 h-16 text-primary" />
          <TempDisplay tempF={weather.current.temperature_2m} units={settings.units} />
        </div>

        <p className="text-xl font-medium mt-2">{wmoInfo.label}</p>
        
        <div className="flex items-center gap-4 text-sm text-muted-foreground font-medium pt-2">
          <span>H: {formatTemp(highF, settings.units)} L: {formatTemp(lowF, settings.units)}</span>
          <div className="flex items-center">
            <Droplets className="w-4 h-4 mr-1 text-blue-500" />
            {precip}%
          </div>
        </div>
      </header>

      <section>
        <h2 className="text-xl font-bold mb-4">Right Now</h2>
        <OutfitCard recommendation={todayRec} />
        
        {closetMatches.length > 0 && (
          <p className="text-sm text-muted-foreground mt-4 px-2">
            <span className="font-semibold text-foreground">From your closet:</span> {closetMatches.join(", ")}
          </p>
        )}
      </section>

      <section>
        <h2 className="text-xl font-bold">Later Today</h2>
        <TimeOfDayTabs {...timeOfDayRecs} />
      </section>
    </motion.div>
  );
}
