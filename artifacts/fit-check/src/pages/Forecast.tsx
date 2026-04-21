import { useFitCheckSettings } from "@/hooks/useFitCheckSettings";
import { useWeather } from "@/hooks/useWeather";
import { getWeatherInfo } from "@/lib/weather-codes";
import { formatTemp, getDayName } from "@/lib/format";
import { WeatherIcon } from "@/components/WeatherIcon";
import { OutfitCard } from "@/components/OutfitCard";
import { generateRecommendation } from "@/lib/recommend";
import { Loader2, Droplets } from "lucide-react";
import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function Forecast() {
  const { settings } = useFitCheckSettings();
  const { data: weather, isLoading } = useWeather(settings.location);

  if (isLoading || !weather) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 h-[80vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary/50" />
      </div>
    );
  }

  const daily = weather.daily;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">5-Day Forecast</h1>
      
      <Accordion type="single" collapsible className="w-full space-y-3">
        {daily.time.map((dateStr, i) => {
          const code = daily.weather_code[i];
          const info = getWeatherInfo(code);
          const maxF = daily.temperature_2m_max[i];
          const minF = daily.temperature_2m_min[i];
          const precip = daily.precipitation_probability_max[i];
          
          const rec = generateRecommendation({
            temperatureF: (maxF + minF) / 2, // average for the day
            feelsLikeF: (maxF + minF) / 2,
            precipChance: precip,
            weatherCode: code,
            windMph: 5, // roughly
            humidity: 50,
            isDay: true,
            style: settings.style
          });

          return (
            <AccordionItem key={dateStr} value={dateStr} className="border bg-card rounded-2xl px-4 py-2 shadow-sm">
              <AccordionTrigger className="hover:no-underline py-3">
                <div className="flex items-center justify-between w-full pr-4">
                  <div className="flex items-center gap-4">
                    <WeatherIcon category={info.category} className="w-10 h-10 text-primary" />
                    <div className="text-left">
                      <p className="font-semibold text-lg">{getDayName(dateStr)}</p>
                      <p className="text-sm text-muted-foreground">{info.label}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">{formatTemp(maxF, settings.units)}</p>
                    <div className="flex items-center justify-end text-sm text-muted-foreground gap-2">
                      <span>{formatTemp(minF, settings.units)}</span>
                      {precip > 0 && (
                        <span className="flex items-center text-blue-500">
                          <Droplets className="w-3 h-3 mr-0.5" />
                          {precip}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-4">
                <OutfitCard recommendation={rec} />
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}
