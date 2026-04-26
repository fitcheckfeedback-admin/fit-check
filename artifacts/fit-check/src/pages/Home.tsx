import { useFitCheckSettings } from "@/hooks/useFitCheckSettings";
import { useWeather } from "@/hooks/useWeather";
import { WeatherScene } from "@/components/WeatherScene";
import { WeatherBackground } from "@/components/WeatherBackground";
import { OutfitLookCard } from "@/components/OutfitLookCard";
import { WeatherAlertBanner } from "@/components/WeatherAlertBanner";
import { generateRecommendation } from "@/lib/recommend";
import { getWeatherTags, matchSavedFits } from "@/lib/savedFitsMatch";
import { SavedFit } from "@/lib/storage";
import { getWeatherInfo } from "@/lib/weather-codes";
import { pickClosetItems } from "@/lib/closetMatch";
import { MapPin, Search, Bell, Bookmark, ChevronRight, X, Share2, Plane, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatTemp } from "@/lib/format";
import { useState, useEffect, useRef } from "react";
import { trackEvent } from "@/lib/analytics";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { VoiceAssistant } from "@/components/VoiceAssistant";
import { useLocation } from "wouter";
import { getOrCreateDeviceId } from "@/lib/deviceId";
import { useQuery } from "@tanstack/react-query";
import { FitCardShareSheet } from "@/components/FitCardShareSheet";
import { generateHashtags } from "@/lib/fitCardHashtags";
import { FitCardData } from "@/lib/fitCardCaption";
import { AIStylistCard } from "@/components/AIStylistCard";
import { CitySearch } from "@/components/CitySearch";

type DetectedLocation = { detected: true; city: string; region: string; lat: number; lon: number } | { detected: false };

function LocationGate({ onLocation }: { onLocation: (loc: { lat: number; lon: number; name: string }) => void }) {
  const [detected, setDetected] = useState<DetectedLocation | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [userCount, setUserCount] = useState<number | null>(null);

  useEffect(() => {
    trackEvent("location_gate_view", {});
    // Detect city from IP and fetch social proof count in parallel
    Promise.all([
      fetch("/api/location/detect").then(r => r.json()).catch(() => ({ detected: false })),
      fetch("/api/analytics/user-count").then(r => r.json()).catch(() => ({ count: null })),
    ]).then(([loc, uc]) => {
      setDetected(loc as DetectedLocation);
      if (uc?.count) setUserCount(Number(uc.count));
    });
  }, []);

  const confirmDetected = () => {
    if (!detected || !detected.detected) return;
    const name = detected.region ? `${detected.city}, ${detected.region}` : detected.city;
    onLocation({ lat: detected.lat, lon: detected.lon, name });
    trackEvent("location_set", { city: name, lat: detected.lat, lon: detected.lon, method: "ip_detected" });
  };

  const handleCitySelect = (city: { name: string; admin1?: string; latitude: number; longitude: number }) => {
    const name = `${city.name}${city.admin1 ? `, ${city.admin1}` : ""}`;
    onLocation({ lat: city.latitude, lon: city.longitude, name });
    trackEvent("location_set", { city: name, lat: city.latitude, lon: city.longitude, method: "city_search" });
  };

  const isLoading = detected === null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex-1 flex flex-col min-h-[100dvh] bg-background"
    >
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-b from-amber-50 to-background dark:from-amber-950/20 dark:to-background px-6 pt-14 pb-10 flex flex-col items-center text-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent pointer-events-none" />

        <motion.img
          src="/logo.png"
          alt="FIT✔️"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="w-16 h-16 rounded-2xl shadow-lg mb-5"
        />

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-3xl font-display font-black leading-tight tracking-tight"
        >
          Your Daily Fit<br />
          <span className="brand-gradient-text">Is Ready.</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
          className="text-muted-foreground mt-3 text-sm max-w-[260px] leading-relaxed"
        >
          Real-time weather + what to actually wear today — personalized for you.
        </motion.p>

        {/* Blurred teaser */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="relative mt-6 w-full max-w-xs"
        >
          <div className="bg-card border rounded-2xl p-4 shadow-sm select-none pointer-events-none">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-xl">☀️</div>
              <div>
                <p className="text-sm font-bold">Today's Fit</p>
                <p className="text-xs text-muted-foreground">
                  Sunny · 74°F · {detected?.detected ? `${detected.city}` : "Your City"}
                </p>
              </div>
              <div className="ml-auto text-xs font-black text-primary bg-primary/10 px-2 py-0.5 rounded-full">98</div>
            </div>
            <div className="space-y-1.5 blur-sm">
              <div className="text-sm font-semibold text-foreground">White linen shirt + slim chinos</div>
              <div className="text-xs text-muted-foreground">Light sneakers or loafers · No jacket needed</div>
              <div className="text-xs text-muted-foreground">Sunglasses recommended · UV high today</div>
            </div>
          </div>
          <div className="absolute inset-0 flex items-end justify-center pb-3 rounded-2xl bg-gradient-to-t from-background/70 via-transparent to-transparent">
            <p className="text-xs font-bold text-primary">Confirm your city to unlock your real fit →</p>
          </div>
        </motion.div>
      </div>

      {/* CTA */}
      <div className="px-6 pb-10 space-y-4 flex flex-col items-center">

        {/* Social proof */}
        {userCount !== null && userCount > 50 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 text-sm text-muted-foreground"
          >
            <div className="flex -space-x-1.5">
              {["🧑", "👩", "🧔"].map((e, i) => (
                <div key={i} className="w-6 h-6 rounded-full bg-muted border-2 border-background flex items-center justify-center text-[10px]">{e}</div>
              ))}
            </div>
            <span className="font-semibold text-foreground">{userCount.toLocaleString()}+</span>&nbsp;people already got their fit
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {isLoading && (
            <motion.div key="loading" exit={{ opacity: 0 }} className="flex flex-col items-center gap-3 py-4">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
                className="w-3 h-3 bg-primary rounded-full"
              />
              <p className="text-sm text-muted-foreground">Finding your city…</p>
            </motion.div>
          )}

          {/* IP detected — one-tap confirm */}
          {!isLoading && detected?.detected && !showSearch && (
            <motion.div
              key="detected"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="w-full max-w-sm space-y-3"
            >
              <div className="flex items-center gap-2 justify-center text-sm text-muted-foreground">
                <MapPin className="w-4 h-4 text-primary" />
                <span>Looks like you're in</span>
                <span className="font-bold text-foreground">
                  {detected.city}{detected.region ? `, ${detected.region}` : ""}
                </span>
              </div>

              <Button
                size="lg"
                className="w-full h-14 rounded-2xl font-bold text-base shadow-md"
                onClick={confirmDetected}
              >
                Yes — show my fit
              </Button>

              <button
                onClick={() => setShowSearch(true)}
                className="w-full text-center text-sm text-muted-foreground underline underline-offset-2 py-1"
              >
                Not my city — search instead
              </button>
            </motion.div>
          )}

          {/* Manual search — fallback or "not my city" */}
          {!isLoading && (!detected?.detected || showSearch) && (
            <motion.div
              key="search"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-sm space-y-3"
            >
              <p className="text-base font-bold text-foreground text-center">
                {showSearch ? "Search your city" : "What city are you in?"}
              </p>
              <CitySearch onSelect={handleCitySelect} autoFocus />
              <p className="text-xs text-muted-foreground text-center max-w-[240px] mx-auto">
                Used to pull live weather and personalize your fit.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default function Home() {
  const { settings, updateSettings } = useFitCheckSettings();
  const { data: weather, isLoading, isError, isFetching, refetch } = useWeather(settings.location);
  const [showSearch, setShowSearch] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [appliedFit, setAppliedFit] = useState<SavedFit | null>(null);
  const [viewDay, setViewDay] = useState<"today" | "tomorrow">("today");
  const [, setLocation] = useLocation();
  const deviceId = getOrCreateDeviceId();
  const trackedWeatherRef = useRef<string | null>(null);

  useEffect(() => {
    if (weather && settings.location) {
      const key = `${settings.location.name}-${weather.current.weather_code}`;
      if (trackedWeatherRef.current !== key) {
        trackedWeatherRef.current = key;
        trackEvent("outfit_generated", {
          weatherCode: weather.current.weather_code,
          tempF: Math.round(weather.current.temperature_2m),
          style: settings.style,
        });
      }
    }
  }, [weather, settings.location, settings.style]);

  const { data: reminders = [] } = useQuery({
    queryKey: ['reminders', deviceId],
    queryFn: async () => {
      const res = await fetch(`/api/push/reminders?deviceId=${deviceId}`);
      if (!res.ok) throw new Error("Failed to load reminders");
      return res.json();
    },
    refetchInterval: 60000,
  });

  if (isLoading || !weather) {
    return (
      <div className="flex-1 flex flex-col p-6 space-y-8">
        <div className="h-64 bg-muted rounded-3xl animate-pulse" />
        <div className="h-48 bg-muted rounded-3xl animate-pulse" />
        <div className="h-32 bg-muted rounded-3xl animate-pulse" />
      </div>
    );
  }

  if (isError || !settings.location) {
    return <LocationGate onLocation={(loc) => updateSettings({ location: loc })} />;
  }

  const isDay = weather.current.is_day === 1;
  const isTomorrow = viewDay === "tomorrow";

  // Today's data
  const todayRec = appliedFit 
    ? {
        mainOutfit: appliedFit.mainOutfit,
        outerwear: appliedFit.outerwear,
        accessories: appliedFit.accessories,
        warnings: [],
        fitScore: appliedFit.fitScore,
        alerts: []
      }
    : generateRecommendation({
        temperatureF: weather.current.temperature_2m,
        feelsLikeF: weather.current.apparent_temperature,
        precipChance: weather.hourly.precipitation_probability[0],
        weatherCode: weather.current.weather_code,
        windMph: weather.current.wind_speed_10m,
        humidity: weather.current.relative_humidity_2m,
        isDay,
        style: settings.style,
        gender: settings.gender,
      });

  // Tomorrow's data
  const tomorrowCode = weather.daily.weather_code[1] ?? weather.daily.weather_code[0];
  const tomorrowHighF = weather.daily.temperature_2m_max[1] ?? weather.daily.temperature_2m_max[0];
  const tomorrowLowF = weather.daily.temperature_2m_min[1] ?? weather.daily.temperature_2m_min[0];
  const tomorrowAvgF = (tomorrowHighF + tomorrowLowF) / 2;
  const tomorrowPrecipHourly = weather.hourly.precipitation_probability.slice(24, 48);
  const tomorrowMaxPrecip = tomorrowPrecipHourly.length ? Math.max(...tomorrowPrecipHourly) : 0;
  const tomorrowRec = generateRecommendation({
    temperatureF: tomorrowAvgF,
    feelsLikeF: tomorrowAvgF,
    precipChance: tomorrowMaxPrecip,
    weatherCode: tomorrowCode,
    windMph: weather.current.wind_speed_10m,
    humidity: weather.current.relative_humidity_2m,
    isDay: true,
    style: settings.style,
    gender: settings.gender,
  });

  // Active (today or tomorrow) variables
  const activeRec = isTomorrow ? tomorrowRec : todayRec;
  const activeWeatherCode = isTomorrow ? tomorrowCode : weather.current.weather_code;
  const activeIsDay = isTomorrow ? true : isDay;
  const activeHighF = isTomorrow ? tomorrowHighF : weather.daily.temperature_2m_max[0];
  const activeLowF = isTomorrow ? tomorrowLowF : weather.daily.temperature_2m_min[0];
  const activeTemp = isTomorrow ? tomorrowAvgF : weather.current.temperature_2m;
  const activeFeelsLike = isTomorrow ? tomorrowAvgF : weather.current.apparent_temperature;
  const wmoInfo = getWeatherInfo(activeWeatherCode);

  const currentTags = getWeatherTags({
    temperatureF: activeTemp,
    feelsLikeF: activeFeelsLike,
    precipChance: isTomorrow ? tomorrowMaxPrecip : weather.hourly.precipitation_probability[0],
    weatherCode: activeWeatherCode,
    windMph: weather.current.wind_speed_10m,
    humidity: weather.current.relative_humidity_2m,
    isDay: activeIsDay,
    style: settings.style
  });

  const matchingFits = matchSavedFits(settings.savedFits || [], currentTags);
  const allSavedFits = settings.savedFits || [];

  const closetMatchResult = pickClosetItems(activeRec, settings.closet, settings.style);

  const highF = activeHighF;
  const lowF = activeLowF;

  const allClosetItems = [
    ...settings.closet.tops.map(i => ({ name: i.name, category: "tops" })),
    ...settings.closet.bottoms.map(i => ({ name: i.name, category: "bottoms" })),
    ...settings.closet.outerwear.map(i => ({ name: i.name, category: "outerwear" })),
    ...settings.closet.shoes.map(i => ({ name: i.name, category: "shoes" })),
    ...settings.closet.accessories.map(i => ({ name: i.name, category: "accessories" })),
  ];

  const shareDate = isTomorrow
    ? new Date(Date.now() + 86400000).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
    : new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

  const shareData: FitCardData | null = weather ? {
    mainOutfit: activeRec.mainOutfit,
    outerwear: activeRec.outerwear,
    accessories: activeRec.accessories,
    fitScore: activeRec.fitScore,
    style: settings.style,
    temperatureF: activeTemp,
    weatherLabel: wmoInfo.label,
    location: settings.location.name,
    date: shareDate,
    hashtags: generateHashtags({ style: settings.style, weatherTags: currentTags, alerts: activeRec.alerts, location: settings.location.name }),
    units: settings.units
  } : null;

  return (
    <div className="flex-1 flex flex-col relative pb-6">
      <AnimatePresence>
        {showSearch && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-0 left-0 right-0 z-50 p-4 bg-background/95 backdrop-blur-xl border-b shadow-lg"
          >
            <CitySearch 
              onSelect={(city) => {
                const name = `${city.name}${city.admin1 ? `, ${city.admin1}` : ''}`;
                updateSettings({ location: { lat: city.latitude, lon: city.longitude, name } });
                trackEvent("location_set", { city: name, lat: city.latitude, lon: city.longitude, method: "city_change" });
                setShowSearch(false);
              }} 
              onCancel={() => setShowSearch(false)}
              autoFocus
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Hero Section ── */}
      {(() => {
        const cat = wmoInfo.category;
        const isDark = !activeIsDay || cat === "rain" || cat === "drizzle" || cat === "showers" || cat === "thunderstorm";
        const textPrimary   = isDark ? "rgba(255,255,255,0.95)" : "rgba(15,15,15,0.92)";
        const textSecondary = isDark ? "rgba(255,255,255,0.65)" : "rgba(15,15,15,0.55)";
        const pillBg        = isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.08)";
        const pillBorder    = isDark ? "rgba(255,255,255,0.2)"  : "rgba(0,0,0,0.08)";
        const toggleBg      = isDark ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.08)";
        const toggleInactive = isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.35)";

        return (
          <motion.section
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative px-5 pt-10 pb-14 overflow-hidden z-10"
          >
            <WeatherBackground weatherCode={activeWeatherCode} isDay={activeIsDay} />

            {/* Top row: location + bell */}
            <div className="relative z-20 flex items-center justify-between mb-4">
              <button
                onClick={() => setShowSearch(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold transition-colors backdrop-blur-md border"
                style={{ background: pillBg, borderColor: pillBorder, color: textPrimary }}
              >
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate max-w-[180px]">{settings.location.name}</span>
                <Search className="w-3 h-3 ml-0.5 opacity-50 shrink-0" />
              </button>

              <div className="flex items-center gap-2">
                <button
                  className="w-9 h-9 flex items-center justify-center rounded-full backdrop-blur-md border transition-colors"
                  style={{ background: pillBg, borderColor: pillBorder }}
                  onClick={() => refetch()}
                  title="Refresh weather"
                >
                  <RefreshCw
                    className="w-4 h-4"
                    style={{
                      color: textPrimary,
                      animation: isFetching ? "spin 1s linear infinite" : "none",
                    }}
                  />
                </button>

                <button
                  className="relative w-9 h-9 flex items-center justify-center rounded-full backdrop-blur-md border transition-colors"
                  style={{ background: pillBg, borderColor: pillBorder }}
                  onClick={() => setLocation('/reminders')}
                >
                  <Bell className="w-5 h-5" style={{ color: textPrimary }} />
                  {reminders.length > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-400 shadow-sm" />
                  )}
                </button>
              </div>
            </div>

            {/* Main: icon left, temp+label right */}
            <div className="relative z-10 flex items-center justify-between px-1">
              <motion.div
                initial={{ scale: 0.75, rotate: -12 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 220, damping: 18 }}
              >
                <WeatherScene weatherCode={activeWeatherCode} isDay={activeIsDay} className="w-28 h-28 drop-shadow-2xl" />
              </motion.div>

              <div className="flex flex-col items-end">
                <div className="flex items-start" style={{ color: textPrimary }}>
                  <span className="text-7xl font-display font-black tracking-tighter leading-none drop-shadow-sm">
                    {formatTemp(activeTemp, settings.units).replace(/°[FC]/, '')}
                  </span>
                  <span className="text-3xl font-display font-bold mt-2 ml-1 opacity-70">
                    {formatTemp(activeTemp, settings.units).match(/°[FC]/)?.[0]}
                  </span>
                </div>
                <p className="text-base font-display font-semibold mt-0.5" style={{ color: textSecondary }}>
                  {wmoInfo.label}
                </p>
                <div className="flex items-center gap-2.5 mt-1.5 text-xs font-semibold" style={{ color: textSecondary }}>
                  <span>↑ {formatTemp(highF, settings.units)}</span>
                  <span className="w-0.5 h-0.5 rounded-full opacity-50" style={{ background: textSecondary }} />
                  <span>↓ {formatTemp(lowF, settings.units)}</span>
                  <span className="w-0.5 h-0.5 rounded-full opacity-50" style={{ background: textSecondary }} />
                  <span>Feels {formatTemp(activeFeelsLike, settings.units)}</span>
                </div>
              </div>
            </div>

            {/* Day toggle */}
            <div className="relative z-10 mt-4 flex justify-center">
              <div
                className="flex items-center gap-0.5 p-1 rounded-full backdrop-blur-md"
                style={{ background: toggleBg }}
              >
                {(["today", "tomorrow"] as const).map(day => (
                  <button
                    key={day}
                    onClick={() => { setViewDay(day); setAppliedFit(null); }}
                    className="px-5 py-1 rounded-full text-xs font-bold transition-all"
                    style={viewDay === day
                      ? { background: "white", color: "hsl(32 100% 52%)", boxShadow: "0 1px 8px rgba(0,0,0,0.15)" }
                      : { color: toggleInactive }
                    }
                  >
                    {day === "today" ? "Today" : "Tomorrow"}
                  </button>
                ))}
              </div>
            </div>

            {/* Gradient fade into page background */}
            <div className="absolute bottom-0 left-0 right-0 h-20 pointer-events-none z-30 bg-gradient-to-b from-transparent to-background" />
          </motion.section>
        );
      })()}

      <div className="px-4 -mt-10 pb-6 space-y-4 relative z-20">
        {!appliedFit && !isTomorrow && activeRec.alerts?.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <WeatherAlertBanner alerts={activeRec.alerts} />
          </motion.div>
        )}

        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-display font-bold tracking-tight">
              {appliedFit ? "Applied Fit" : isTomorrow ? "Tomorrow's Fit" : "Today's Fit"}
            </h2>
            <div className="flex items-center gap-2">
              {appliedFit && (
                <button onClick={() => setAppliedFit(null)} className="flex items-center gap-1 text-xs font-semibold text-muted-foreground px-2.5 py-1.5 rounded-full bg-muted hover:bg-muted/80 transition-colors">
                  <X className="w-3.5 h-3.5" /> Clear
                </button>
              )}
              <button onClick={() => setShowShare(true)} className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-primary/10 hover:bg-primary/20 text-primary transition-colors">
                <Share2 className="w-3.5 h-3.5" /> Share
              </button>
            </div>
          </div>
          <OutfitLookCard
            recommendation={activeRec}
            closetMatch={closetMatchResult}
            weatherTags={currentTags}
          />
        </motion.section>

        {/* AI Stylist */}
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <AIStylistCard
            weather={{
              tempF: activeTemp,
              feelsLikeF: activeFeelsLike,
              condition: wmoInfo.label,
              windMph: weather.current.wind_speed_10m,
              precipChance: isTomorrow ? tomorrowMaxPrecip : weather.hourly.precipitation_probability[0],
              isDay: activeIsDay,
            }}
            closetItems={allClosetItems}
            style={settings.style}
            gender={settings.gender}
          />
        </motion.section>

        {/* Saved Fits Section */}
        {allSavedFits.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <div className="flex items-center justify-between mb-4 px-1">
              <div className="flex items-center gap-2">
                <Bookmark className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-display font-bold">Saved Fits</h2>
              </div>
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="link" size="sm" className="h-8 px-2 text-muted-foreground font-semibold">
                    See all <ChevronRight className="w-4 h-4 ml-0.5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="h-[85vh] rounded-t-[2rem] p-0 flex flex-col">
                  <SheetHeader className="p-6 border-b text-left">
                    <SheetTitle className="text-2xl font-display font-bold flex items-center gap-2">
                      <Bookmark className="w-5 h-5 text-primary" />
                      Saved Fits
                    </SheetTitle>
                  </SheetHeader>
                  <div className="flex-1 overflow-y-auto p-6 space-y-4 hide-scrollbar">
                    {allSavedFits.map(fit => (
                      <div key={fit.id} className="bg-card border rounded-2xl p-4 shadow-sm flex flex-col gap-3">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h4 className="font-bold text-lg leading-tight">{fit.label}</h4>
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{fit.mainOutfit}</p>
                          </div>
                          <Button 
                            variant="secondary" 
                            size="sm" 
                            className="shrink-0 rounded-xl font-bold"
                            onClick={() => {
                              setAppliedFit(fit);
                              // Close sheet logic can be handled by Radix automatically if wrapped, but we'll just let them swipe it away or we can trigger it.
                              // A simple way is to close the sheet by clicking a custom close or letting them close it.
                              document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
                            }}
                          >
                            Apply
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {fit.weatherTags.map(tag => (
                            <span key={tag} className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-muted rounded-md text-muted-foreground">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            {matchingFits.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1">
                  {isTomorrow ? "Matches tomorrow's weather" : "Matches today's weather"}
                </h3>
                <div className="flex overflow-x-auto hide-scrollbar gap-4 pb-2 snap-x">
                  {matchingFits.map((fit, i) => (
                    <motion.div
                      key={fit.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + i * 0.1 }}
                      className="snap-start shrink-0 w-64 bg-card border rounded-2xl p-4 shadow-sm relative overflow-hidden"
                      onClick={() => setAppliedFit(fit)}
                      role="button"
                    >
                      <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 rounded-bl-full pointer-events-none" />
                      <h4 className="font-bold truncate text-foreground/90">{fit.label}</h4>
                      <p className="text-sm text-muted-foreground truncate mt-1">{fit.mainOutfit}</p>
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {fit.weatherTags.slice(0, 3).map(tag => (
                          <span key={tag} className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-muted rounded-md text-muted-foreground">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </motion.section>
        )}

        {/* Trip Planner promo */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <button
            onClick={() => setLocation('/trip')}
            className="w-full rounded-3xl p-5 flex items-center gap-4 shadow-sm text-left"
            style={{ background: "linear-gradient(135deg, #1a0f00 0%, #2a1800 100%)", border: "1px solid rgba(255,149,0,0.2)" }}
          >
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
              style={{ background: "linear-gradient(135deg, #FF9500, #FF6B00)" }}>
              <Plane className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-display font-black text-white text-base leading-tight">Trip Planner</p>
              <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>
                Day-by-day outfits & packing list for any destination
              </p>
            </div>
            <ChevronRight className="w-5 h-5 shrink-0" style={{ color: "rgba(255,149,0,0.6)" }} />
          </button>
        </motion.section>
      </div>
      
      {weather && activeRec && (
        <VoiceAssistant 
          weatherData={weather} 
          recommendation={activeRec} 
          settings={settings} 
          autoStart={new URLSearchParams(window.location.search).get('voice') === '1'}
          onCloseAutoStart={() => {
            const url = new URL(window.location.href);
            url.searchParams.delete('voice');
            window.history.replaceState({}, '', url);
          }}
        />
      )}

      <FitCardShareSheet 
        open={showShare} 
        onOpenChange={setShowShare} 
        data={shareData} 
      />
    </div>
  );
}
