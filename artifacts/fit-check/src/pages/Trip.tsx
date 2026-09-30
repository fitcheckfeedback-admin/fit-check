import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plane, MapPin, Calendar, ChevronLeft, Package, Sparkles, Droplets, Wind, Tag, Loader2, X } from "lucide-react";
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
import { ClosetData } from "@/lib/storage";
import { flattenCloset } from "@/lib/appContext";
import { fetchDeals, Deal } from "@/lib/deals";
import { DealResults } from "@/components/DealResults";

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

interface WeatherNeeds {
  cold: boolean;
  cool: boolean;
  warm: boolean;
  hot: boolean;
  rain: boolean;
}

function deriveNeeds(days: TripDayForecast[]): WeatherNeeds {
  const needs: WeatherNeeds = { cold: false, cool: false, warm: false, hot: false, rain: false };
  for (const d of days) {
    if (d.precipChance > 40) needs.rain = true;
    if (d.avgF < 50) needs.cold = true;
    else if (d.avgF < 65) needs.cool = true;
    else if (d.avgF <= 78) needs.warm = true;
    else needs.hot = true;
  }
  return needs;
}

export interface SmartPackingSection {
  label: string;
  /** Items the user already owns (from their closet). */
  owned: string[];
  /** Complementing essentials the weather calls for but the closet lacks. */
  missing: string[];
}

/**
 * Smart packing list: cross-references the destination forecast with what
 * the user actually owns. Each section lists owned items first, then the
 * complementing essentials worth packing (or shopping for).
 */
export function buildSmartPackingList(
  days: TripDayForecast[],
  closet: ClosetData,
  _style: string,
  _gender: string = "unspecified"
): SmartPackingSection[] {
  const needs = deriveNeeds(days);
  const has = (names: string[], ...words: string[]) =>
    names.some((n) => words.some((w) => n.includes(w)));

  const sections: SmartPackingSection[] = [];
  const cats: { key: keyof ClosetData; label: string }[] = [
    { key: "tops", label: "Tops" },
    { key: "bottoms", label: "Bottoms" },
    { key: "outerwear", label: "Layers" },
    { key: "shoes", label: "Shoes" },
    { key: "accessories", label: "Don't forget" },
  ];

  for (const { key, label } of cats) {
    const ownedNames = (closet[key] ?? []).map((i) => i.name);
    const ownedLower = ownedNames.map((n) => n.toLowerCase());
    const missing: string[] = [];

    if (key === "outerwear") {
      if (needs.cold && !has(ownedLower, "coat", "parka", "puffer", "heavy jacket")) missing.push("Warm insulated coat");
      if (needs.rain && !has(ownedLower, "rain")) missing.push("Rain jacket");
      if ((needs.cool || needs.warm) && !has(ownedLower, "jacket", "coat", "blazer", "windbreaker", "hoodie", "cardigan"))
        missing.push("Light jacket or windbreaker");
    } else if (key === "tops") {
      if (needs.cold && !has(ownedLower, "sweater", "hoodie", "fleece", "thermal", "turtleneck")) missing.push("Sweaters or hoodies");
      if (needs.hot && !has(ownedLower, "tank", "linen")) missing.push("Breathable tees or tanks");
    } else if (key === "bottoms") {
      if (needs.cold && !has(ownedLower, "jean", "pant", "trouser", "corduroy")) missing.push("Jeans or heavier pants");
      if (needs.hot && !has(ownedLower, "short")) missing.push("Shorts");
    } else if (key === "shoes") {
      if (needs.rain && !has(ownedLower, "waterproof", "rain boot", "galosh")) missing.push("Water-resistant shoes");
      if (needs.cold && !has(ownedLower, "boot")) missing.push("Boots");
      if (needs.hot && !has(ownedLower, "sandal", "flip")) missing.push("Sandals");
    } else if (key === "accessories") {
      if (needs.cold && !has(ownedLower, "beanie", "warm hat", "glove", "scarf")) missing.push("Warm hat & gloves");
      if (needs.hot && !has(ownedLower, "sunglass")) missing.push("Sunglasses");
      if (needs.rain && !has(ownedLower, "umbrella")) missing.push("Compact umbrella");
      if (needs.hot && !has(ownedLower, "sunscreen")) missing.push("Sunscreen SPF 30+");
    }

    if (ownedNames.length > 0 || missing.length > 0) {
      sections.push({ label, owned: ownedNames, missing });
    }
  }

  return sections;
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
  const [dealState, setDealState] = useState<{
    query: string;
    loading: boolean;
    summary: string;
    deals: Deal[];
    error: string | null;
  } | null>(null);

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

  const packing = forecast ? buildSmartPackingList(forecast, settings.closet, settings.style, settings.gender) : null;
  const nightsBefore = forecast ? Math.max(0, Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000)) : 0;

  async function runDealSearch(item: string) {
    const query = `Find deals on ${item.toLowerCase()} in ${settings.style || "my"} style`;
    setDealState({ query, loading: true, summary: "", deals: [], error: null });
    const result = await fetchDeals(query, {
      closetItems: flattenCloset(settings.closet),
      style: settings.style,
      gender: settings.gender,
    });
    if (result.ok) {
      setDealState({ query, loading: false, summary: result.summary, deals: result.deals, error: null });
    } else if (result.error === "daily_limit") {
      setDealState({
        query,
        loading: false,
        summary: "",
        deals: [],
        error: result.detail ?? "You've hit today's deal search limit — it resets tomorrow.",
      });
    } else {
      setDealState({ query, loading: false, summary: "", deals: [], error: "Deal search isn't working right now. Try again in a bit." });
    }
  }

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
                  {packing.map((section) => (
                    <div key={section.label}>
                      <span className="text-[10px] uppercase tracking-widest font-black text-primary">{section.label}</span>
                      {section.owned.length > 0 && (
                        <div className="mt-1.5">
                          <p className="text-[11px] font-semibold text-muted-foreground mb-1">From your closet</p>
                          <div className="space-y-1">
                            {section.owned.map((item) => (
                              <div key={item} className="flex items-start gap-2">
                                <div className="w-4 h-4 rounded border-2 border-border mt-0.5 shrink-0" />
                                <span className="text-sm font-medium">{item}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {section.missing.length > 0 && (
                        <div className="mt-2">
                          <p className="text-[11px] font-bold text-amber-600 dark:text-amber-400 mb-1">Worth adding</p>
                          <div className="space-y-1.5">
                            {section.missing.map((item) => (
                              <div key={item} className="flex items-center gap-2">
                                <Tag className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                <span className="text-sm font-medium flex-1">{item}</span>
                                <button
                                  onClick={() => runDealSearch(item)}
                                  className="shrink-0 text-xs font-bold px-2.5 py-1 rounded-full border border-orange-300 text-orange-600 dark:text-orange-400"
                                >
                                  Find deals
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Inline deal results for a complementing item */}
            {dealState && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card border rounded-2xl p-5 shadow-sm"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{ background: "linear-gradient(135deg, #FF9500, #FF6B00)" }}>
                    <Tag className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="font-display font-black text-base leading-tight flex-1">Deals</h3>
                  <button
                    onClick={() => setDealState(null)}
                    className="p-1.5 rounded-full text-muted-foreground"
                    aria-label="Close deals"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                {dealState.loading ? (
                  <div className="flex items-center gap-2 py-6 justify-center">
                    <Loader2 className="w-5 h-5 animate-spin text-orange-500" />
                    <span className="text-sm text-muted-foreground font-medium">Searching live deals…</span>
                  </div>
                ) : dealState.error ? (
                  <p className="text-sm text-destructive font-medium">{dealState.error}</p>
                ) : (
                  <>
                    {dealState.summary && (
                      <p className="text-sm text-muted-foreground mb-1">{dealState.summary}</p>
                    )}
                    <DealResults deals={dealState.deals} />
                  </>
                )}
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
