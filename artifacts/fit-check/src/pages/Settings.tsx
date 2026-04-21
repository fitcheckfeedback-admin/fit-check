import { useState } from "react";
import { useFitCheckSettings } from "@/hooks/useFitCheckSettings";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { MapPin, RefreshCw, Sun, Moon, Laptop, Thermometer, Trash2 } from "lucide-react";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useLocation } from "wouter";
import { CitySearch } from "@/components/CitySearch";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

export default function Settings() {
  const { settings, updateSettings } = useFitCheckSettings();
  const { getCurrentPosition, loading } = useGeolocation();
  const [, setLocation] = useLocation();
  const [showCitySearch, setShowCitySearch] = useState(false);

  const handleUpdateLocation = async () => {
    try {
      const pos = await getCurrentPosition();
      updateSettings({
        location: {
          lat: pos.lat,
          lon: pos.lon,
          name: "Current Location"
        }
      });
    } catch (e) {
      console.error(e);
      setShowCitySearch(true);
    }
  };

  const handleSelectCity = (city: any) => {
    updateSettings({
      location: {
        lat: city.latitude,
        lon: city.longitude,
        name: `${city.name}${city.admin1 ? `, ${city.admin1}` : ''}`
      }
    });
    setShowCitySearch(false);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-6 space-y-8 pb-24"
    >
      <div>
        <h1 className="text-4xl font-display font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground font-medium">Manage your preferences and location.</p>
      </div>

      <section className="space-y-4">
        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider pl-2">Location</h2>
        <div className="bg-card rounded-[2rem] border shadow-sm overflow-hidden">
          <div className="p-5 flex items-center justify-between bg-muted/20 border-b">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-xl text-primary">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Current</p>
                <p className="text-base font-semibold text-foreground">{settings.location?.name || "Not set"}</p>
              </div>
            </div>
          </div>
          
          <AnimatePresence mode="wait">
            {showCitySearch ? (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="p-5"
              >
                <CitySearch 
                  onSelect={handleSelectCity} 
                  onCancel={() => setShowCitySearch(false)} 
                  autoFocus 
                />
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-5 grid grid-cols-2 gap-3"
              >
                <Button 
                  variant="secondary" 
                  className="w-full h-12 rounded-xl text-base" 
                  onClick={handleUpdateLocation} 
                  disabled={loading}
                >
                  {loading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <MapPin className="w-4 h-4 mr-2" />}
                  Auto-detect
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full h-12 rounded-xl text-base bg-background" 
                  onClick={() => setShowCitySearch(true)}
                >
                  Search City
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider pl-2">Preferences</h2>
        
        <div className="bg-card rounded-[2rem] border shadow-sm divide-y">
          {/* Temperature Units */}
          <div className="p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-xl text-blue-500">
                <Thermometer className="w-5 h-5" />
              </div>
              <Label className="text-base font-semibold">Temperature</Label>
            </div>
            
            <div className="flex bg-muted p-1 rounded-2xl">
              <button
                className={cn(
                  "flex-1 py-2.5 text-sm font-bold rounded-xl transition-all",
                  settings.units === "f" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
                onClick={() => updateSettings({ units: "f" })}
              >
                Fahrenheit (°F)
              </button>
              <button
                className={cn(
                  "flex-1 py-2.5 text-sm font-bold rounded-xl transition-all",
                  settings.units === "c" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
                onClick={() => updateSettings({ units: "c" })}
              >
                Celsius (°C)
              </button>
            </div>
          </div>

          {/* Theme */}
          <div className="p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-xl text-purple-500">
                <Sun className="w-5 h-5" />
              </div>
              <Label className="text-base font-semibold">App Theme</Label>
            </div>
            
            <div className="flex bg-muted p-1 rounded-2xl">
              {[
                { id: "light", icon: Sun, label: "Light" },
                { id: "dark", icon: Moon, label: "Dark" },
                { id: "system", icon: Laptop, label: "Auto" },
              ].map(t => {
                const isActive = settings.theme === t.id;
                const Icon = t.icon;
                return (
                  <button
                    key={t.id}
                    className={cn(
                      "flex-1 flex flex-col items-center justify-center py-3 gap-1.5 rounded-xl transition-all",
                      isActive ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                    )}
                    onClick={() => updateSettings({ theme: t.id as any })}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-xs font-bold">{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="pt-8">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button 
              variant="outline" 
              className="w-full h-14 rounded-2xl text-destructive border-destructive/20 hover:bg-destructive/10 hover:border-destructive/30"
            >
              <Trash2 className="w-5 h-5 mr-2" />
              Reset App Data
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="rounded-3xl">
            <AlertDialogHeader>
              <AlertDialogTitle className="font-display text-2xl">Are you sure?</AlertDialogTitle>
              <AlertDialogDescription className="text-base">
                This will clear your location, style preference, and entire closet. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="mt-4 gap-2">
              <AlertDialogCancel className="rounded-xl h-12">Cancel</AlertDialogCancel>
              <AlertDialogAction 
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl h-12"
                onClick={() => {
                  localStorage.clear();
                  window.location.href = "/";
                }}
              >
                Yes, reset everything
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </section>
    </motion.div>
  );
}
