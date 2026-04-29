import { useState, useEffect } from "react";
import { Search, Loader2, MapPin, Navigation } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { searchCity, reverseGeocode } from "@/lib/weather";
import { motion, AnimatePresence } from "framer-motion";

interface CitySearchProps {
  onSelect: (city: { name: string; admin1?: string; latitude: number; longitude: number }) => void;
  onCancel?: () => void;
  autoFocus?: boolean;
}

export function CitySearch({ onSelect, onCancel, autoFocus = false }: CitySearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.length >= 2) {
        setLoading(true);
        try {
          const res = await searchCity(query);
          setResults(res);
        } catch (e) {
          console.error(e);
        } finally {
          setLoading(false);
        }
      } else {
        setResults([]);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [query]);

  const handleGPS = () => {
    if (!navigator.geolocation) {
      setGpsError("GPS not available on this device.");
      return;
    }
    setGpsLoading(true);
    setGpsError(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const name = await reverseGeocode(latitude, longitude);
          onSelect({ name: name ?? "My Location", latitude, longitude });
        } catch {
          onSelect({ name: "My Location", latitude, longitude });
        } finally {
          setGpsLoading(false);
        }
      },
      (err) => {
        setGpsLoading(false);
        if (err.code === err.PERMISSION_DENIED) {
          setGpsError("Location permission denied. Search for your city instead.");
        } else {
          setGpsError("Couldn't get GPS location. Try searching your city.");
        }
      },
      { timeout: 10000, maximumAge: 60000 }
    );
  };

  return (
    <div className="w-full space-y-3">
      {/* GPS button */}
      <button
        onClick={handleGPS}
        disabled={gpsLoading}
        className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-primary/10 hover:bg-primary/15 active:scale-[0.98] transition-all border border-primary/20 disabled:opacity-60"
      >
        {gpsLoading
          ? <Loader2 className="w-5 h-5 text-primary animate-spin shrink-0" />
          : <Navigation className="w-5 h-5 text-primary shrink-0" />}
        <span className="font-semibold text-primary text-sm">
          {gpsLoading ? "Getting your location…" : "Use my current location"}
        </span>
      </button>

      {gpsError && (
        <p className="text-xs text-destructive font-medium px-1">{gpsError}</p>
      )}

      <div className="flex items-center gap-2">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-muted-foreground font-semibold">or search</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for a city..."
          className="h-14 pl-10 pr-10 rounded-2xl bg-card border-2 text-base shadow-sm focus-visible:ring-primary focus-visible:border-primary transition-all"
          autoFocus={autoFocus}
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>

      <AnimatePresence>
        {results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-2 max-h-[300px] overflow-y-auto hide-scrollbar bg-card border rounded-2xl p-2 shadow-lg"
          >
            {results.map((city) => (
              <motion.button
                whileTap={{ scale: 0.98 }}
                key={city.id}
                className="w-full flex items-center p-3 rounded-xl hover:bg-accent text-left transition-colors"
                onClick={() => onSelect(city)}
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mr-3 shrink-0">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="font-semibold text-foreground text-base">{city.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {city.admin1 ? `${city.admin1}, ` : ''}{city.country}
                  </div>
                </div>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {onCancel && (
        <Button variant="ghost" onClick={onCancel} className="w-full text-muted-foreground">
          Cancel
        </Button>
      )}
    </div>
  );
}
