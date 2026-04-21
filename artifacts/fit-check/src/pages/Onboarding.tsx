import { useState } from "react";
import { useLocation } from "wouter";
import { MapPin, Search, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useFitCheckSettings } from "@/hooks/useFitCheckSettings";
import { searchCity } from "@/lib/weather";

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const { updateSettings } = useFitCheckSettings();
  const { getCurrentPosition, loading: geoLoading } = useGeolocation();
  
  const [mode, setMode] = useState<"initial" | "search">("initial");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const handleUseLocation = async () => {
    try {
      const pos = await getCurrentPosition();
      // Reverse geocode or just use a generic name for now
      // Ideally we'd reverse geocode, but we can set a placeholder and update later
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
      // fallback to search
      setMode("search");
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setSearchLoading(true);
    try {
      const results = await searchCity(searchQuery);
      setSearchResults(results);
    } catch (e) {
      console.error(e);
    } finally {
      setSearchLoading(false);
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

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center p-6 bg-background">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm space-y-8 text-center"
      >
        <div className="space-y-3">
          <h1 className="text-4xl font-bold tracking-tight text-primary">Fit Check</h1>
          <p className="text-lg text-muted-foreground">What to wear, based on the weather.</p>
        </div>

        {mode === "initial" ? (
          <div className="space-y-4 pt-8">
            <Button 
              size="lg" 
              className="w-full h-14 text-base rounded-2xl" 
              onClick={handleUseLocation}
              disabled={geoLoading}
            >
              {geoLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <MapPin className="mr-2 h-5 w-5" />}
              Use my location
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="w-full h-14 text-base rounded-2xl"
              onClick={() => setMode("search")}
              disabled={geoLoading}
            >
              <Search className="mr-2 h-5 w-5" />
              Search by city
            </Button>
          </div>
        ) : (
          <div className="space-y-4 pt-4 text-left">
            <Button 
              variant="ghost" 
              className="mb-2"
              onClick={() => setMode("initial")}
            >
              Back
            </Button>
            <form onSubmit={handleSearch} className="flex gap-2">
              <Input 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter city name..."
                className="h-12 rounded-xl text-base"
                autoFocus
              />
              <Button type="submit" className="h-12 rounded-xl px-6" disabled={searchLoading}>
                {searchLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Search"}
              </Button>
            </form>

            {searchResults.length > 0 && (
              <div className="space-y-2 mt-4">
                {searchResults.map((city) => (
                  <Button
                    key={city.id}
                    variant="outline"
                    className="w-full justify-start h-14 rounded-xl text-base font-normal"
                    onClick={() => handleSelectCity(city)}
                  >
                    <MapPin className="mr-3 h-5 w-5 text-muted-foreground" />
                    <div className="flex flex-col items-start">
                      <span>{city.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {city.admin1 ? `${city.admin1}, ` : ''}{city.country}
                      </span>
                    </div>
                  </Button>
                ))}
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
