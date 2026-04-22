import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { MapPin, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useFitCheckSettings } from "@/hooks/useFitCheckSettings";
import { WeatherScene } from "@/components/WeatherScene";
import { CitySearch } from "@/components/CitySearch";

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const { updateSettings } = useFitCheckSettings();
  const { getCurrentPosition, loading: geoLoading } = useGeolocation();
  
  const [mode, setMode] = useState<"initial" | "search">("initial");

  const handleUseLocation = async () => {
    try {
      const pos = await getCurrentPosition();
      updateSettings({
        location: {
          lat: pos.lat,
          lon: pos.lon,
          name: "Current Location"
        },
        onboarded: true
      });
      setLocation("/");
    } catch (e) {
      console.error(e);
      setMode("search");
    }
  };

  const handleSelectCity = (city: any) => {
    updateSettings({
      location: {
        lat: city.latitude,
        lon: city.longitude,
        name: `${city.name}${city.admin1 ? `, ${city.admin1}` : ''}`
      },
      onboarded: true
    });
    setLocation("/");
  };

  // Staggered text animation
  const titleText = "Fit Check";
  const subtitleText = "What to wear, based on the weather.";

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center p-6 bg-gradient-to-b from-primary/10 via-background to-background dark:from-primary/5 dark:via-background dark:to-background relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-sm relative z-10">
        <AnimatePresence mode="wait">
          {mode === "initial" && (
            <motion.div 
              key="initial"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="flex flex-col items-center text-center space-y-10"
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="relative"
              >
                <motion.div 
                  animate={{ opacity: [0.4, 0.7, 0.4], scale: [0.9, 1.1, 0.9] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -inset-8 brand-glow -z-10 rounded-full"
                />
                <img src="/logo.png" alt="Fit Check Logo" className="w-32 h-32 rounded-[2rem] drop-shadow-2xl shadow-primary/20 object-cover relative z-10" />
              </motion.div>

              <div className="space-y-3">
                <h1 className="text-5xl font-display font-black tracking-tighter brand-gradient-text">
                  {titleText.split("").map((char, i) => (
                    <motion.span
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + i * 0.05 }}
                    >
                      {char}
                    </motion.span>
                  ))}
                </h1>
                <p className="text-lg text-muted-foreground font-medium">
                  {subtitleText.split(" ").map((word, i) => (
                    <motion.span
                      key={i}
                      className="inline-block mr-1"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 + i * 0.1 }}
                    >
                      {word}
                    </motion.span>
                  ))}
                </p>
              </div>

              <motion.div 
                className="w-full space-y-4 pt-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
              >
                <Button 
                  size="lg" 
                  className="w-full h-14 text-base rounded-2xl shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30" 
                  onClick={handleUseLocation}
                  disabled={geoLoading}
                >
                  {geoLoading ? (
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                      <MapPin className="mr-2 h-5 w-5" />
                    </motion.div>
                  ) : (
                    <MapPin className="mr-2 h-5 w-5" />
                  )}
                  Use my location
                </Button>
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="w-full h-14 text-base rounded-2xl border-2 bg-transparent hover:bg-accent group"
                  onClick={() => setMode("search")}
                  disabled={geoLoading}
                >
                  Search by city
                  <ArrowRight className="ml-2 h-4 w-4 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </Button>
              </motion.div>
            </motion.div>
          )}

          {mode === "search" && (
            <motion.div
              key="search"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="w-full"
            >
              <div className="mb-6">
                <h2 className="text-3xl font-display font-bold mb-2">Where are you?</h2>
                <p className="text-muted-foreground">Find your city to get local weather.</p>
              </div>
              <CitySearch 
                onSelect={handleSelectCity} 
                onCancel={() => setMode("initial")} 
                autoFocus 
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
