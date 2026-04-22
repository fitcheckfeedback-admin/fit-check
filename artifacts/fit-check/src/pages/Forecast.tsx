import { useFitCheckSettings } from "@/hooks/useFitCheckSettings";
import { useWeather } from "@/hooks/useWeather";
import { getWeatherInfo } from "@/lib/weather-codes";
import { formatTemp, getDayName } from "@/lib/format";
import { WeatherScene } from "@/components/WeatherScene";
import { OutfitCard } from "@/components/OutfitCard";
import { generateRecommendation } from "@/lib/recommend";
import { Droplets } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from "recharts";

export default function Forecast() {
  const { settings } = useFitCheckSettings();
  const { data: weather, isLoading } = useWeather(settings.location);
  const [expandedDay, setExpandedDay] = useState<string | null>(null);

  if (isLoading || !weather) {
    return (
      <div className="flex-1 flex flex-col p-6 space-y-4 mt-8">
        <div className="h-40 bg-muted rounded-3xl animate-pulse" />
        {[1,2,3,4,5].map(i => (
          <div key={i} className="h-24 bg-muted rounded-3xl animate-pulse" />
        ))}
      </div>
    );
  }

  const daily = weather.daily;
  
  // Prepare chart data for next 24h
  const chartData = weather.hourly.time.slice(0, 24).filter((_, i) => i % 3 === 0).map((t, i) => {
    const idx = i * 3;
    const date = new Date(t);
    return {
      time: i === 0 ? "Now" : date.toLocaleTimeString([], { hour: 'numeric' }),
      temp: Math.round(weather.hourly.temperature_2m[idx])
    };
  });

  const minChartTemp = Math.min(...chartData.map(d => d.temp)) - 5;
  const maxChartTemp = Math.max(...chartData.map(d => d.temp)) + 5;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-6 space-y-8 pb-12"
    >
      <div className="flex items-center gap-4 mb-2">
        <img src="/logo.png" alt="Logo" className="w-10 h-10 rounded-xl shadow-sm" />
        <div>
          <h1 className="text-4xl font-display font-bold"><span className="brand-gradient-text">Fore</span>cast</h1>
          <p className="text-muted-foreground font-medium">Next 5 days and what to wear.</p>
        </div>
      </div>

      {/* Mini 24h trend chart */}
      <section className="bg-card border rounded-[2rem] p-5 shadow-sm">
        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">24h Trend</h2>
        <div className="h-[120px] w-full ml-[-10px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis 
                dataKey="time" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} 
                dy={10}
              />
              <YAxis 
                domain={[minChartTemp, maxChartTemp]} 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              />
              <Line 
                type="monotone" 
                dataKey="temp" 
                stroke="hsl(var(--primary))" 
                strokeWidth={3}
                dot={{ r: 4, fill: "hsl(var(--background))", stroke: "hsl(var(--primary))", strokeWidth: 2 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>
      
      <section className="space-y-3">
        {daily.time.map((dateStr, i) => {
          const code = daily.weather_code[i];
          const info = getWeatherInfo(code);
          const maxF = daily.temperature_2m_max[i];
          const minF = daily.temperature_2m_min[i];
          const precip = daily.precipitation_probability_max[i];
          
          const isExpanded = expandedDay === dateStr;

          const rec = generateRecommendation({
            temperatureF: (maxF + minF) / 2,
            feelsLikeF: (maxF + minF) / 2,
            precipChance: precip,
            weatherCode: code,
            windMph: 5,
            humidity: 50,
            isDay: true,
            style: settings.style
          });

          // Calc width for the range bar
          // overall min/max for the 5 days to normalize
          const overallMin = Math.min(...daily.temperature_2m_min);
          const overallMax = Math.max(...daily.temperature_2m_max);
          const range = overallMax - overallMin;
          const leftPct = ((minF - overallMin) / range) * 100;
          const widthPct = ((maxF - minF) / range) * 100;

          return (
            <motion.div 
              layout
              key={dateStr} 
              className={`border bg-card rounded-3xl shadow-sm overflow-hidden transition-colors ${isExpanded ? 'border-primary/30 ring-1 ring-primary/10' : ''}`}
            >
              <button 
                onClick={() => setExpandedDay(isExpanded ? null : dateStr)}
                className="w-full px-5 py-4 flex items-center justify-between text-left outline-none"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-12 h-12 shrink-0">
                    <WeatherScene weatherCode={code} isDay={true} />
                  </div>
                  <div className="w-24">
                    <p className="font-bold text-base">{getDayName(dateStr)}</p>
                    {precip > 20 && (
                      <p className="text-xs font-bold text-blue-500 flex items-center mt-0.5">
                        <Droplets className="w-3 h-3 mr-0.5" />{precip}%
                      </p>
                    )}
                  </div>
                  
                  {/* Temp range bar */}
                  <div className="flex-1 flex items-center gap-3 px-2">
                    <span className="text-sm font-semibold text-muted-foreground w-6 text-right">{Math.round(minF)}°</span>
                    <div className="h-2 flex-1 bg-muted rounded-full relative overflow-hidden hidden sm:block">
                      <div 
                        className="absolute h-full rounded-full bg-gradient-to-r from-blue-400 to-primary"
                        style={{ left: `${leftPct}%`, width: `${Math.max(10, widthPct)}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold w-6">{Math.round(maxF)}°</span>
                  </div>
                </div>
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 pt-0 border-t border-border/50 bg-muted/20">
                      <OutfitCard recommendation={rec} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </section>
    </motion.div>
  );
}
