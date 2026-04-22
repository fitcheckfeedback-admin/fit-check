import { useFitCheckSettings } from "@/hooks/useFitCheckSettings";
import { useWeather } from "@/hooks/useWeather";
import { TempDisplay } from "@/components/TempDisplay";
import { WeatherScene } from "@/components/WeatherScene";
import { WeatherBackground } from "@/components/WeatherBackground";
import { OutfitCard } from "@/components/OutfitCard";
import { WeatherAlertBanner } from "@/components/WeatherAlertBanner";
import { TimeOfDayTabs } from "@/components/TimeOfDayTabs";
import { CitySearch } from "@/components/CitySearch";
import { generateRecommendation, generateTimeOfDayRecs } from "@/lib/recommend";
import { getWeatherTags, matchSavedFits } from "@/lib/savedFitsMatch";
import { SavedFit } from "@/lib/storage";
import { getWeatherInfo } from "@/lib/weather-codes";
import { pickClosetItems } from "@/lib/closetMatch";
import { useClosetImage } from "@/hooks/useClosetImage";
import { MapPin, Droplets, Wind, Sunset, Sunrise, Search, Shirt, Scissors, Layers, Footprints, Bell, Bookmark, ChevronRight, X, Share2, Gem } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatTemp, formatTime } from "@/lib/format";
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

function ClosetMatchThumbnail({ item, label, icon: Icon }: { item: import("@/lib/storage").ClosetItem; label: string; icon: any }) {
  const { src } = useClosetImage(item.imageId);
  return (
    <div className="flex flex-col items-center gap-2 group shrink-0">
      <div className="w-20 h-20 rounded-2xl bg-card border-2 border-border shadow-sm overflow-hidden relative">
        {src ? (
          <img src={src} alt={item.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted/30 text-muted-foreground">
             <Icon className="w-8 h-8 opacity-50" />
          </div>
        )}
      </div>
      <div className="text-center w-20">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider leading-tight mb-0.5">{label}</p>
        <p className="text-xs font-semibold text-foreground truncate" title={item.name}>{item.name}</p>
      </div>
    </div>
  );
}

export default function Home() {
  const { settings, updateSettings } = useFitCheckSettings();
  const { data: weather, isLoading, isError } = useWeather(settings.location);
  const [showSearch, setShowSearch] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [appliedFit, setAppliedFit] = useState<SavedFit | null>(null);
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
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-6">
        <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center">
          <MapPin className="w-8 h-8 text-muted-foreground" />
        </div>
        <div>
          <h2 className="text-2xl font-display font-bold">Location needed</h2>
          <p className="text-muted-foreground mt-2">Search for a city to see your fit check.</p>
        </div>
        <div className="w-full max-w-sm text-left">
          <CitySearch onSelect={(city) => {
            updateSettings({
              location: {
                lat: city.latitude,
                lon: city.longitude,
                name: `${city.name}${city.admin1 ? `, ${city.admin1}` : ''}`
              }
            });
          }} />
        </div>
      </div>
    );
  }

  const wmoInfo = getWeatherInfo(weather.current.weather_code);
  const isDay = weather.current.is_day === 1;
  
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
        style: settings.style
      });

  const currentTags = getWeatherTags({
    temperatureF: weather.current.temperature_2m,
    feelsLikeF: weather.current.apparent_temperature,
    precipChance: weather.hourly.precipitation_probability[0],
    weatherCode: weather.current.weather_code,
    windMph: weather.current.wind_speed_10m,
    humidity: weather.current.relative_humidity_2m,
    isDay,
    style: settings.style
  });

  const matchingFits = matchSavedFits(settings.savedFits || [], currentTags);
  const allSavedFits = settings.savedFits || [];

  const timeOfDayRecs = generateTimeOfDayRecs(weather.hourly, settings.style, settings.units);

  const closetMatchResult = pickClosetItems(todayRec, settings.closet, settings.style);
  const matchedItems = [
    { cat: "tops", label: "Top", icon: Shirt, item: closetMatchResult.tops },
    { cat: "bottoms", label: "Bottom", icon: Scissors, item: closetMatchResult.bottoms },
    { cat: "outerwear", label: "Layer", icon: Layers, item: closetMatchResult.outerwear },
    { cat: "shoes", label: "Shoes", icon: Footprints, item: closetMatchResult.shoes },
    { cat: "accessories", label: "Accessory", icon: Gem, item: closetMatchResult.accessories },
  ].filter(x => x.item !== undefined);

  const highF = weather.daily.temperature_2m_max[0];
  const lowF = weather.daily.temperature_2m_min[0];

  const shareData: FitCardData | null = weather ? {
    mainOutfit: todayRec.mainOutfit,
    outerwear: todayRec.outerwear,
    accessories: todayRec.accessories,
    fitScore: todayRec.fitScore,
    style: settings.style,
    temperatureF: weather.current.temperature_2m,
    weatherLabel: wmoInfo.label,
    location: settings.location.name,
    date: new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }),
    hashtags: generateHashtags({ style: settings.style, weatherTags: currentTags, alerts: todayRec.alerts, location: settings.location.name }),
    units: settings.units
  } : null;

  return (
    <div className="flex-1 flex flex-col relative pb-28">
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
                updateSettings({
                  location: {
                    lat: city.latitude,
                    lon: city.longitude,
                    name: `${city.name}${city.admin1 ? `, ${city.admin1}` : ''}`
                  }
                });
                setShowSearch(false);
              }} 
              onCancel={() => setShowSearch(false)}
              autoFocus
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section with WeatherBackground */}
      <motion.section 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative pt-12 pb-16 px-6 overflow-hidden rounded-b-[2.5rem] shadow-sm z-10"
      >
        <WeatherBackground weatherCode={weather.current.weather_code} isDay={isDay} />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/15 to-transparent pointer-events-none mix-blend-overlay dark:mix-blend-color-dodge z-10" />
        
        <div className="absolute top-4 left-6 z-20 flex flex-col">
          <div className="flex items-center gap-3 relative">
            <motion.div
              animate={{ opacity: [0.5, 0.8, 0.5], scale: [1, 1.1, 1] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -inset-4 brand-glow -z-10 rounded-full"
            />
            <img src="/logo.png" alt="Fit Check" className="w-12 h-12 rounded-xl shadow-lg relative z-10" />
            <div className="flex flex-col justify-center">
              <span className="font-display font-black text-2xl tracking-tight brand-gradient-text leading-none mt-1">Fit Check</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-foreground/60 leading-tight">Today's fit, sorted</span>
            </div>
          </div>
        </div>

        <div className="absolute top-6 right-6 z-20">
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full bg-background/20 hover:bg-background/40 backdrop-blur-md relative"
            onClick={() => setLocation('/reminders')}
          >
            <Bell className="w-5 h-5 text-foreground/90" />
            {reminders.length > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-500 border border-background shadow-sm" />
            )}
          </Button>
        </div>

        <div className="relative z-10 flex flex-col items-center text-center mt-14">
          <button 
            onClick={() => setShowSearch(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-background/20 hover:bg-background/30 backdrop-blur-md rounded-full text-foreground/90 font-medium text-sm transition-colors mb-8"
          >
            <MapPin className="w-4 h-4" />
            <span className="truncate max-w-[200px]">{settings.location.name}</span>
            <Search className="w-3 h-3 ml-1 opacity-50" />
          </button>
          
          <div className="flex flex-row items-center justify-center gap-6">
            <motion.div
              initial={{ scale: 0.8, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
            >
              <WeatherScene weatherCode={weather.current.weather_code} isDay={isDay} className="w-28 h-28 drop-shadow-xl" />
            </motion.div>
            
            <div className="flex flex-col items-start">
              <TempDisplay tempF={weather.current.temperature_2m} units={settings.units} />
              <p className="text-xl font-display font-medium tracking-wide text-foreground/90">{wmoInfo.label}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 mt-6 px-5 py-2.5 bg-background/20 backdrop-blur-md rounded-2xl text-sm text-foreground/90 font-medium border border-background/20 shadow-sm">
            <span>H: {formatTemp(highF, settings.units)}</span>
            <span className="w-1 h-1 rounded-full bg-foreground/30" />
            <span>L: {formatTemp(lowF, settings.units)}</span>
            <span className="w-1 h-1 rounded-full bg-foreground/30" />
            <span>Feels {formatTemp(weather.current.apparent_temperature, settings.units)}</span>
          </div>
        </div>
      </motion.section>

      <div className="p-6 space-y-8 -mt-6 relative z-20">
        {!appliedFit && todayRec.alerts?.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
            <WeatherAlertBanner alerts={todayRec.alerts} />
          </motion.div>
        )}

        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center justify-between mb-4 px-1">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-primary" />
              </div>
              <h2 className="text-2xl font-display font-bold">
                {appliedFit ? "Applied Fit" : "Today's Fit"}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              {appliedFit && (
                <Button variant="ghost" size="sm" onClick={() => setAppliedFit(null)} className="h-8 px-2 text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4 mr-1" /> Clear
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => setShowShare(true)} className="h-8 px-3 rounded-full font-bold">
                <Share2 className="w-4 h-4 mr-1.5" /> Share
              </Button>
            </div>
          </div>
          <OutfitCard recommendation={todayRec} weatherTags={currentTags} />
          
          {matchedItems.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 bg-card border rounded-3xl p-5 shadow-sm overflow-hidden relative"
            >
              <div className="absolute -top-10 -left-10 w-32 h-32 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
              <div className="flex items-center justify-between mb-4 relative z-10">
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Wear Today
                </h3>
              </div>
              <div className="flex overflow-x-auto hide-scrollbar gap-4 pb-1 relative z-10 snap-x">
                {matchedItems.map((match, i) => (
                  <div key={i} className="snap-start">
                    <ClosetMatchThumbnail item={match.item!} label={match.label} icon={match.icon} />
                  </div>
                ))}
              </div>
            </motion.div>
          )}
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
                  Matches today's weather
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

        {/* Hourly Strip */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="bg-card border rounded-3xl p-4 shadow-sm">
            <div className="flex overflow-x-auto hide-scrollbar gap-4 pb-2 snap-x">
              {weather.hourly.time.slice(0, 24).map((time, i) => {
                // only show every 2 hours or if it's the first few
                if (i > 4 && i % 2 !== 0) return null;
                
                const hourDate = new Date(time);
                const isNow = i === 0;
                const temp = weather.hourly.temperature_2m[i];
                const pop = weather.hourly.precipitation_probability[i];
                const code = weather.hourly.weather_code[i];
                const isDayHour = hourDate.getHours() >= 6 && hourDate.getHours() <= 18;

                return (
                  <div key={time} className={`flex flex-col items-center justify-between space-y-3 snap-start shrink-0 w-14 ${isNow ? 'bg-primary/10 p-2 -mx-2 rounded-2xl' : ''}`}>
                    <span className={`text-xs font-medium ${isNow ? 'text-primary font-bold' : 'text-muted-foreground'}`}>
                      {isNow ? 'Now' : hourDate.toLocaleTimeString([], {hour: 'numeric'})}
                    </span>
                    <div className="w-8 h-8">
                       <WeatherScene weatherCode={code} isDay={isDayHour} />
                    </div>
                    <span className="font-semibold">{formatTemp(temp, settings.units)}</span>
                    {pop > 0 ? (
                      <span className="text-[10px] font-bold text-blue-500 flex items-center"><Droplets className="w-2.5 h-2.5 mr-0.5" />{pop}%</span>
                    ) : (
                      <span className="text-[10px] font-medium text-transparent">-</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-2xl font-display font-bold mb-4 px-1">Later Today</h2>
          <TimeOfDayTabs {...timeOfDayRecs} />
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-2 gap-4"
        >
          <div className="bg-card border rounded-3xl p-5 shadow-sm flex flex-col">
            <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5"><Wind className="w-4 h-4"/> Wind</span>
            <span className="text-2xl font-display font-bold">{Math.round(weather.current.wind_speed_10m)} <span className="text-base text-muted-foreground font-sans font-medium">mph</span></span>
          </div>
          
          <div className="bg-card border rounded-3xl p-5 shadow-sm flex flex-col">
            <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5"><Droplets className="w-4 h-4"/> Humidity</span>
            <span className="text-2xl font-display font-bold">{Math.round(weather.current.relative_humidity_2m)}%</span>
          </div>

          <div className="col-span-2 bg-card border rounded-3xl p-5 shadow-sm flex justify-between items-center">
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1.5"><Sunrise className="w-4 h-4"/> Sunrise</span>
              <span className="font-semibold text-lg">{formatTime(weather.daily.sunrise[0])}</span>
            </div>
            <div className="w-px h-10 bg-border" />
            <div className="flex flex-col text-right">
              <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-1 flex items-center justify-end gap-1.5"><Sunset className="w-4 h-4"/> Sunset</span>
              <span className="font-semibold text-lg">{formatTime(weather.daily.sunset[0])}</span>
            </div>
          </div>
        </motion.section>
      </div>
      
      {weather && todayRec && (
        <VoiceAssistant 
          weatherData={weather} 
          recommendation={todayRec} 
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
