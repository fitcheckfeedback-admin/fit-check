import { useState } from "react";
import { Sparkles, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

interface AIStylistCardProps {
  weather: {
    tempF: number;
    feelsLikeF: number;
    condition: string;
    windMph: number;
    precipChance: number;
    isDay: boolean;
  };
  closetItems: { name: string; category: string }[];
  style: string;
}

export function AIStylistCard({ weather, closetItems, style }: AIStylistCardProps) {
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);

  async function fetchStyling() {
    setLoading(true);
    setError(null);
    setResult(null);
    setCollapsed(false);
    try {
      const res = await fetch("/api/ai/stylist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weather, closetItems, style }),
      });
      if (!res.ok) throw new Error("Request failed");
      const data = await res.json();
      setResult(data.recommendation);
    } catch {
      setError("Couldn't reach the AI stylist. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl overflow-hidden shadow-sm"
      style={{ background: "linear-gradient(135deg, #FF9500 0%, #FF6B00 100%)" }}
    >
      <div className="p-5">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-white/90" />
            <span className="text-[11px] font-black uppercase tracking-wider text-white/80">AI Stylist</span>
          </div>
          {result && (
            <button onClick={() => setCollapsed(c => !c)} className="text-white/70">
              {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          )}
        </div>

        {!result && !loading && (
          <>
            <p className="text-white font-semibold text-base mb-3 leading-snug">
              {closetItems.length > 0
                ? `Get a recommendation built from your ${closetItems.length} closet items.`
                : "Get a personalized outfit recommendation for today's weather."}
            </p>
            <Button
              onClick={fetchStyling}
              variant="ghost"
              className="w-full bg-white/20 hover:bg-white/30 text-white font-bold rounded-2xl h-11 border border-white/20"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Style My Outfit
            </Button>
          </>
        )}

        {loading && (
          <div className="flex items-center gap-3 py-3">
            <Loader2 className="w-5 h-5 text-white animate-spin" />
            <span className="text-white font-semibold text-sm">Analyzing your wardrobe…</span>
          </div>
        )}

        {error && (
          <div className="space-y-2">
            <p className="text-white/80 text-sm">{error}</p>
            <Button
              onClick={fetchStyling}
              variant="ghost"
              className="bg-white/20 text-white font-bold rounded-xl h-9 px-4"
            >
              Try again
            </Button>
          </div>
        )}

        <AnimatePresence>
          {result && !collapsed && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-2 pt-3 border-t border-white/20">
                <div className="text-white text-sm leading-relaxed whitespace-pre-line font-medium">
                  {result}
                </div>
                <button
                  onClick={fetchStyling}
                  className="mt-3 text-white/60 text-xs font-semibold hover:text-white/90 transition-colors"
                >
                  Refresh suggestion
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
