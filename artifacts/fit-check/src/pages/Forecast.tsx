import { useFitCheckSettings } from "@/hooks/useFitCheckSettings";
import { useWeather } from "@/hooks/useWeather";
import { getWeatherInfo } from "@/lib/weather-codes";
import { formatTemp } from "@/lib/format";
import { WeatherScene } from "@/components/WeatherScene";
import { Droplets, CloudRain, CalendarDays, Wind, Sunrise, Sunset, Thermometer } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { RadarMap } from "@/components/RadarMap";

export default function Forecast() {
  const { settings } = useFitCheckSettings();
  const { data: weather, isLoading } = useWeather(settings.location);
  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"forecast" | "radar">("forecast");

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

  // Always start from today — compare ISO date strings to avoid timezone UTC issues
  const todayStr = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD
  const startIdx = Math.max(0, daily.time.findIndex(t => t >= todayStr));
  const days = daily.time.slice(startIdx, startIdx + 5);

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

  const overallMin = Math.min(...days.map((_, j) => daily.temperature_2m_min[startIdx + j]));
  const overallMax = Math.max(...days.map((_, j) => daily.temperature_2m_max[startIdx + j]));
  const range = overallMax - overallMin || 1;

  function formatSunTime(raw: string) {
    if (!raw) return "—";
    try { return new Date(raw).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }); }
    catch { return raw; }
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-6 space-y-6 pb-12"
    >
      {/* Header */}
      <div className="flex items-center gap-4 mb-2">
        <img src="/logo.png" alt="Logo" className="w-10 h-10 rounded-xl shadow-sm" />
        <div>
          <h1 className="text-4xl font-display font-bold"><span className="brand-gradient-text">Fore</span>cast</h1>
          <p className="text-muted-foreground font-medium">Next 5 days + live radar.</p>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex bg-muted rounded-2xl p-1 gap-1">
        <button
          onClick={() => setActiveTab("forecast")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            activeTab === "forecast" ? "bg-background shadow text-foreground" : "text-muted-foreground"
          }`}
        >
          <CalendarDays className="w-4 h-4" />
          5-Day
        </button>
        <button
          onClick={() => setActiveTab("radar")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            activeTab === "radar" ? "bg-background shadow text-foreground" : "text-muted-foreground"
          }`}
        >
          <CloudRain className="w-4 h-4" />
          Radar
        </button>
      </div>

      {/* Radar view */}
      {activeTab === "radar" && settings.location && (
        <div className="space-y-3">
          <RadarMap
            lat={settings.location.lat}
            lon={settings.location.lon}
            temperatureF={weather.current.temperature_2m}
            units={settings.units}
          />
          <p className="text-xs text-center text-muted-foreground">
            Live precipitation radar · Powered by RainViewer · Auto-updates every 30s
          </p>
        </div>
      )}

      {/* Forecast view */}
      {activeTab === "forecast" && (
        <div className="space-y-8">

          {/* 24h trend chart */}
          <section className="bg-card border rounded-[2rem] p-5 shadow-sm">
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">Today's 24h Trend</h2>
            <div className="h-[120px] w-full ml-[-10px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} dy={10} />
                  <YAxis domain={[minChartTemp, maxChartTemp]} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                  <Line type="monotone" dataKey="temp" stroke="hsl(var(--primary))" strokeWidth={3}
                    dot={{ r: 4, fill: "hsl(var(--background))", stroke: "hsl(var(--primary))", strokeWidth: 2 }}
                    activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* 5-day list — starting TODAY */}
          <section className="space-y-3">
            {days.map((dateStr, j) => {
              const i = startIdx + j;
              const code = daily.weather_code[i];
              const info = getWeatherInfo(code);
              const maxF = daily.temperature_2m_max[i];
              const minF = daily.temperature_2m_min[i];
              const precip = daily.precipitation_probability_max[i];
              const sunrise = daily.sunrise?.[i] ?? "";
              const sunset = daily.sunset?.[i] ?? "";

              const isExpanded = expandedDay === dateStr;
              const leftPct = ((minF - overallMin) / range) * 100;
              const widthPct = ((maxF - minF) / range) * 100;

              const label = j === 0 ? "Today" : j === 1 ? "Tomorrow"
                : new Date(dateStr + "T12:00:00").toLocaleDateString([], { weekday: "long" });

              return (
                <motion.div
                  layout
                  key={dateStr}
                  className={`border bg-card rounded-3xl shadow-sm overflow-hidden transition-colors ${isExpanded ? "border-primary/30 ring-1 ring-primary/10" : ""}`}
                >
                  <button
                    onClick={() => setExpandedDay(isExpanded ? null : dateStr)}
                    className="w-full px-5 py-4 flex items-center justify-between text-left outline-none"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <WeatherScene weatherCode={code} isDay={true} className="w-12 h-12 shrink-0" />
                      <div className="w-24">
                        <p className="font-bold text-base">{label}</p>
                        {precip > 20 && (
                          <p className="text-xs font-bold text-blue-500 flex items-center mt-0.5">
                            <Droplets className="w-3 h-3 mr-0.5" />{precip}%
                          </p>
                        )}
                      </div>

                      {/* Temp range bar */}
                      <div className="flex-1 flex items-center gap-3 px-2">
                        <span className="text-sm font-semibold text-muted-foreground w-6 text-right">
                          {formatTemp(minF, settings.units).replace(/°[FC]/, "°")}
                        </span>
                        <div className="h-2 flex-1 bg-muted rounded-full relative overflow-hidden hidden sm:block">
                          <div
                            className="absolute h-full rounded-full bg-gradient-to-r from-blue-400 to-primary"
                            style={{ left: `${leftPct}%`, width: `${Math.max(10, widthPct)}%` }}
                          />
                        </div>
                        <span className="text-sm font-bold w-6">
                          {formatTemp(maxF, settings.units).replace(/°[FC]/, "°")}
                        </span>
                      </div>
                    </div>
                  </button>

                  {/* Expanded: weather details only — no outfit suggestions */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 pb-5 pt-3 border-t border-border/50 bg-muted/20 space-y-4">
                          {/* Condition */}
                          <p className="text-sm font-semibold text-foreground">{info.label}</p>

                          {/* Stats grid */}
                          <div className="grid grid-cols-2 gap-3">
                            <div className="flex items-center gap-2 bg-background rounded-2xl px-3 py-2.5 shadow-sm">
                              <Thermometer className="w-4 h-4 text-orange-400 shrink-0" />
                              <div>
                                <p className="text-[10px] text-muted-foreground font-medium">High / Low</p>
                                <p className="text-sm font-bold">
                                  {formatTemp(maxF, settings.units)} / {formatTemp(minF, settings.units)}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 bg-background rounded-2xl px-3 py-2.5 shadow-sm">
                              <Droplets className="w-4 h-4 text-blue-400 shrink-0" />
                              <div>
                                <p className="text-[10px] text-muted-foreground font-medium">Rain Chance</p>
                                <p className="text-sm font-bold">{precip}%</p>
                              </div>
                            </div>

                            {sunrise && (
                              <div className="flex items-center gap-2 bg-background rounded-2xl px-3 py-2.5 shadow-sm">
                                <Sunrise className="w-4 h-4 text-amber-400 shrink-0" />
                                <div>
                                  <p className="text-[10px] text-muted-foreground font-medium">Sunrise</p>
                                  <p className="text-sm font-bold">{formatSunTime(sunrise)}</p>
                                </div>
                              </div>
                            )}

                            {sunset && (
                              <div className="flex items-center gap-2 bg-background rounded-2xl px-3 py-2.5 shadow-sm">
                                <Sunset className="w-4 h-4 text-rose-400 shrink-0" />
                                <div>
                                  <p className="text-[10px] text-muted-foreground font-medium">Sunset</p>
                                  <p className="text-sm font-bold">{formatSunTime(sunset)}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </section>
        </div>
      )}
    </motion.div>
  );
}
