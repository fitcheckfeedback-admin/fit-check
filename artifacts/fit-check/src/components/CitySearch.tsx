import { useState, useEffect } from "react";
import { Search, Loader2, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { searchCity } from "@/lib/weather";
import { motion, AnimatePresence } from "framer-motion";

// src/components/CitySearch.tsx
// Inline city search experience

interface CitySearchProps {
  onSelect: (city: any) => void;
  onCancel?: () => void;
  autoFocus?: boolean;
}

export function CitySearch({ onSelect, onCancel, autoFocus = false }: CitySearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

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

  return (
    <div className="w-full space-y-4">
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
