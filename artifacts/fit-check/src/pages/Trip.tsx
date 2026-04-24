import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plane, MapPin, Calendar, ChevronLeft, Package, Sparkles, Droplets, Wind } from "lucide-react";
import { ProGate } from "@/components/ProGate";
import { CitySearch } from "@/components/CitySearch";
import { WeatherScene } from "@/components/WeatherScene";
import { Button } from "@/components/ui/button";
import { fetchTripForecast, TripDayForecast } from "@/lib/weather";
import { generateRecommendation } from "@/lib/recommend";
import { formatTemp } from "@/lib/format";
import { getWeatherInfo } from "@/lib/weather-codes";
import { useFitCheckSettings } from "@/hooks/useFitCheckSettings";
import { useLocation } from "wouter";

interface TripLocation {
  name: string;
  lat: number;
  lon: number;
}

function toDateInput(date: Date) {
  return date.toISOString().slice(0, 10);
}

function formatDisplayDate(dateStr: string) {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function buildPackingList(days: TripDayForecast[], style: string, gender: string = "unspecified") {
  const layers = new Set<string>();
  const tops = new Set<string>();
  const bottoms = new Set<string>();
  const shoes = new Set<string>();
  const extras = new Set<string>();

  let hasRain = false;
  let hasCold = false;
  let hasHot = false;
  let hasWind = false;

  for (const day of days) {
    if (day.precipChance > 40) hasRain = true;
    if (day.avgF < 50) hasCold = true;
    if (day.avgF > 78) hasHot = true;

    const rec = generateRecommendation({
      temperatureF: day.avgF,
      feelsLikeF: day.avgF,
      precipChance: day.precipChance,
      weatherCode: day.weatherCode,
      windMph: 8,
      humidity: 50,
      isDay: true,
      style: style as any,
      gender: gender as any,
    });

    if (rec.outerwear) layers.add(rec.outerwear);
    const mainParts = rec.mainOutfit.split(/[,+]/);
    mainParts.forEach(p => {
      const t = p.trim().toLowerCase();
      if (t.includes("shirt") || t.includes("tee") || t.includes("top") || t.includes("henley") || t.includes("long sleeve") || t.includes("layer")) tops.add(p.trim());
      if (t.includes("jeans") || t.includes("pants") || t.includes("chinos") || t.includes("shorts") || t.includes("skirt") || t.includes("trousers")) bottoms.add(p.trim());
      if (t.includes("sneakers") || t.includes("shoes") || t.includes("boots") || t.includes("sandals") || t.includes("loafers")) shoes.add(p.trim());
    });
  }

  if (hasRain) extras.add("Compact umbrella / rain jacket");
  if (hasCold) extras.add("Warm hat & gloves");
  if (hasHot) extras.add("Sunscreen SPF 30+");
  if (hasWind) extras.add("Windproof layer");
  extras.add("Comfortable walking shoes");

  return { layers: [...layers], tops: [...tops], bottoms: [...bottoms], shoes: [...shoes], extras: [...extras] };
}

export default function Trip() {
  const { settings } = useFitCheckSettings();
  const [, nav] = useLocation();

  const today = new Date();
  const weekOut = new Date(today);
  weekOut.setDate(weekOut.getDate() + 7);

  const [destination, setDestination] = useState<TripLocation | null>(null);
  const [startDate, setStartDate] = useState(toDateInput(today));
  const [endDate, setEndDate] = useState(toDateInput(weekOut));
  const [showSearch, setShowSearch] = useState(false);
  const [forecast, setForecast] = useState<TripDayForecast[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedDay, setExpandedDay] = useState<number | null>(0);

  async function handlePlan() {
    if (!destination) return;
    setLoading(true);
    setError(null);
    setForecast(null);
    try {
      const days = await fetchTripForecast(destination.lat, destination.lon, startDate, endDate);
      setForecast(days);
      setExpandedDay(0);
    } catch {
      setError("Could not load forecast. Try different dates.");
    } finally {
      setLoading(false);
    }
  }

  const packing = forecast ? buildPackingList(forecast, settings.style, settings.gender) : null;
  const nightsBefore = forecast ? Math.max(0, Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000)) : 0;

  return (
    <ProGate
      feature="Trip Planner"
      description="Plan any trip with day-by-day outfit suggestions and a smart packing list built from your closet and the destination's forecast."
    >
    <div className="flex-1 flex flex-col pb-6">
      {/* Header */}
      <div className="relative px-5 pt-14 pb-6 overflow-hidden rounded-b-[2.5rem]"
        style={{ background: "linear-gradient(160deg, #fff4e6 0%, #fde8cc 40%, #ffe4d6 100%)" }}>
        <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full opacity-40"
          style={{ background: "radial-gradient(circle, #FF9500 0%, transparent 70%)", filter: "blur(40px)" }} />

        <div className="flex items-center gap-3 mb-6 relative z-10">
          <button onClick={() => nav("/")} className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.5)", backdropFilter: "blur(8px)" }}>
            <ChevronLeft className="w-5 h-5 text-foreground/70" />
          </button>
          <div>
            <h1 className="text-2xl font-display font-black tracking-tight leading-none">Trip Planner</h1>
            <p className="text-xs text-muted-foreground font-medium mt-0.5">What to pack, day by day</p>
          </div>
          <div className="ml-auto w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #FF9500, #FF6B00)" }}>
            <Plane className="w-4 h-4 text-white" />
          </div>
        </div>

        {/* Destination */}
        <div className="relative z-10 space-y-3">
          <button
            onClick={() => setShowSearch(true)}
            className="w-full flex items-center gap-3 px-4 py-3.5 bg-white/70 backdrop-blur-sm rounded-2xl text-left shadow-sm"
          >
            <MapPin className="w-4 h-4 shrink-0 text-primary" />
            <span className={destination ? "font-semibold text-foreground" : "text-muted-foreground"}>
              {destination?.name ?? "Where are you going?"}
            </span>
          </button>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 px-4 py-3 bg-white/70 backdrop-blur-sm rounded-2xl shadow-sm">
              <Calendar className="w-4 h-4 shrink-0 text-primary" />
              <input
                type="date"
                value={startDate}
                min={toDateInput(today)}
                onChange={e => setStartDate(e.target.value)}
                className="bg-transparent text-sm font-semibold w-full outline-none text-foreground"
              />
            </div>
            <div className="flex items-center gap-2 px-4 py-3 bg-white/70 backdrop-blur-sm rounded-2xl shadow-sm">
              <Calendar className="w-4 h-4 shrink-0 text-primary" />
              <input
                type="date"
                value={endDate}
                min={startDate}
                onChange={e => setEndDate(e.target.value)}
                className="bg-transparent text-sm font-semibold w-full outline-none text-foreground"
              />
            </div>
          </div>

          <Button
            onClick={handlePlan}
            disabled={!destination || loading}
            className="w-full h-12 rounded-2xl font-bold text-base"
            style={{ background: "linear-gradient(135deg, #FF9500, #FF6B00)" }}
          >
            {loading ? "Loading forecast…" : "Plan My Trip"}
          </Button>
        </div>
      </div>

      {/* City search overlay */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="absolute top-0 left-0 right-0 z-50 p-4 bg-background/95 backdrop-blur-xl border-b shadow-lg"
          >
            <CitySearch
              onSelect={city => {
                setDestination({ name: `${city.name}${city.admin1 ? `, ${city.admin1}` : ""}, ${city.country}`, lat: city.latitude, lon: city.longitude });
                setShowSearch(false);
                setForecast(null);
              }}
              onCancel={() => setShowSearch(false)}
              autoFocus
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="px-5 pt-6 space-y-6">
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-4 text-sm text-destructive font-medium">{error}</div>
        )}

        {loading && (
          <div className="space-y-3">
            {[1,2,3].map(i => (
              <div key={i} className="h-20 bg-muted rounded-2xl animate-pulse" />
            ))}
          </div>
        )}

        {forecast && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xl font-display font-black">
                {destination?.name.split(",")[0]} · {nightsBefore} nights
              </h2>
            </div>

            {forecast.map((day, i) => {
              const rec = generateRecommendation({
                temperatureF: day.avgF,
                feelsLikeF: day.avgF,
                precipChance: day.precipChance,
                weatherCode: day.weatherCode,
                windMph: 8,
                humidity: 50,
                isDay: true,
                style: settings.style as any,
                gender: settings.gender,
              });
              const info = getWeatherInfo(day.weatherCode);
              const isExpanded = expandedDay === i;

              return (
                <motion.div
                  key={day.date}
                  layout
                  onClick={() => setExpandedDay(isExpanded ? null : i)}
                  className="bg-card border rounded-2xl overflow-hidden shadow-sm cursor-pointer"
                >
                  <div className="flex items-center gap-3 p-4">
                    <WeatherScene weatherCode={day.weatherCode} isDay={true} className="w-10 h-10 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm">{formatDisplayDate(day.date)}</span>
                        <span className="text-xs font-semibold text-muted-foreground">
                          {Math.round(day.highF)}° / {Math.round(day.lowF)}°
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{info.label}</p>
                    </div>
                    {day.precipChance > 30 && (
                      <span className="text-xs font-bold text-blue-500 flex items-center gap-0.5 shrink-0">
                        <Droplets className="w-3 h-3" />{day.precipChance}%
                      </span>
                    )}
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 border-t pt-3 space-y-2">
                          <div>
                            <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Wear</span>
                            <p className="text-sm font-semibold mt-0.5">{rec.mainOutfit}</p>
                          </div>
                          {rec.outerwear && (
                            <div>
                              <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Layer</span>
                              <p className="text-sm font-semibold mt-0.5">{rec.outerwear}</p>
                            </div>
                          )}
                          {rec.accessories.length > 0 && (
                            <div>
                              <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Extras</span>
                              <p className="text-sm font-semibold mt-0.5">{rec.accessories.join(", ")}</p>
                            </div>
                          )}
                          <div className="flex items-center gap-3 pt-1">
                            <span className="text-xs font-bold px-2 py-1 rounded-full bg-primary/10 text-primary">FIT {rec.fitScore}</span>
                            {formatTemp(day.highF, settings.units)} high · {formatTemp(day.lowF, settings.units)} low
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}

            {/* Packing list */}
            {packing && (
              <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                className="bg-card border rounded-2xl p-5 shadow-sm mt-2"
              >
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{ background: "linear-gradient(135deg, #FF9500, #FF6B00)" }}>
                    <Package className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-display font-black text-lg leading-none">Packing List</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{nightsBefore} nights · {destination?.name.split(",")[0]}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {[
                    { label: "Tops", items: packing.tops },
                    { label: "Bottoms", items: packing.bottoms },
                    { label: "Layers", items: packing.layers },
                    { label: "Shoes", items: packing.shoes },
                    { label: "Don't forget", items: packing.extras },
                  ].filter(s => s.items.length > 0).map(({ label, items }) => (
                    <div key={label}>
                      <span className="text-[10px] uppercase tracking-widest font-black text-primary">{label}</span>
                      <div className="mt-1.5 space-y-1">
                        {items.map(item => (
                          <div key={item} className="flex items-start gap-2">
                            <div className="w-4 h-4 rounded border-2 border-border mt-0.5 shrink-0" />
                            <span className="text-sm font-medium">{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {!forecast && !loading && (
          <div className="flex flex-col items-center text-center py-12 gap-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #FF9500, #FF6B00)" }}>
              <Plane className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="font-display font-black text-lg">Plan any trip</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-[240px]">
                Pick a destination and dates to get day-by-day outfit plans and a smart packing list.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
    </ProGate>
  );
}
