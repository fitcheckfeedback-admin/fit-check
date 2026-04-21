import { useFitCheckSettings } from "@/hooks/useFitCheckSettings";
import { useWeather } from "@/hooks/useWeather";
import { TempDisplay } from "@/components/TempDisplay";
import { WeatherScene } from "@/components/WeatherScene";
import { WeatherBackground } from "@/components/WeatherBackground";
import { OutfitCard } from "@/components/OutfitCard";
import { TimeOfDayTabs } from "@/components/TimeOfDayTabs";
import { CitySearch } from "@/components/CitySearch";
import { generateRecommendation, generateTimeOfDayRecs } from "@/lib/recommend";
import { getWeatherInfo } from "@/lib/weather-codes";
import { MapPin, Droplets, Wind, Sunset, Sunrise, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatTemp, formatTime } from "@/lib/format";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { VoiceAssistant } from "@/components/VoiceAssistant";

export default function Home() {
  const { settings, updateSettings } = useFitCheckSettings();
  const { data: weather, isLoading, isError } = useWeather(settings.location);
  const [showSearch, setShowSearch] = useState(false);

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
  
  const todayRec = generateRecommendation({
    temperatureF: weather.current.temperature_2m,
    feelsLikeF: weather.current.apparent_temperature,
    precipChance: weather.hourly.precipitation_probability[0],
    weatherCode: weather.current.weather_code,
    windMph: weather.current.wind_speed_10m,
    humidity: weather.current.relative_humidity_2m,
    isDay,
    style: settings.style
  });

  const timeOfDayRecs = generateTimeOfDayRecs(weather.hourly, settings.style, settings.units);

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
    if (words.some(w => allRecWords.includes(w)) && item.trim() !== "") {
      closetMatches.push(item);
    }
  });

  const highF = weather.daily.temperature_2m_max[0];
  const lowF = weather.daily.temperature_2m_min[0];

  return (
    <div className="flex-1 flex flex-col relative pb-8">
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
        
        <div className="absolute top-6 left-6 z-20 flex items-center gap-2">
          <img src="/logo.png" alt="Fit Check" className="w-8 h-8 rounded-lg shadow-sm" />
          <span className="font-display font-bold text-foreground/90 tracking-tight">Fit Check</span>
        </div>

        <div className="relative z-10 flex flex-col items-center text-center mt-6">
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
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className="text-2xl font-display font-bold mb-4 px-1">Today's Fit</h2>
          <OutfitCard recommendation={todayRec} />
          
          {closetMatches.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-4 px-2"
            >
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">From your closet</p>
              <div className="flex flex-wrap gap-2">
                {closetMatches.map((item, i) => (
                  <span key={i} className="px-3 py-1.5 bg-card border rounded-lg text-sm font-medium shadow-sm">
                    {item}
                  </span>
                ))}
              </div>
            </motion.div>
          )}
        </motion.section>

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
                const info = getWeatherInfo(code);
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
    </div>
  );
}
