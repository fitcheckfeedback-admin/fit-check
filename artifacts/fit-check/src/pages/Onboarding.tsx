import { useState } from "react";
import { useLocation } from "wouter";
import { MapPin, ArrowRight, Plus, X, Check, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useFitCheckSettings } from "@/hooks/useFitCheckSettings";
import { CitySearch } from "@/components/CitySearch";
import { trackEvent } from "@/lib/analytics";
import { STYLE_TYPES } from "@/lib/storage";
import { reverseGeocode } from "@/lib/weather";

type Step = "welcome" | "search" | "style";

export default function Onboarding() {
  const [, navigate] = useLocation();
  const { updateSettings } = useFitCheckSettings();
  const { getCurrentPosition, loading: geoLoading } = useGeolocation();

  const [step, setStep] = useState<Step>("welcome");
  const [pendingLocation, setPendingLocation] = useState<{ lat: number; lon: number; name: string } | null>(null);
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [customInput, setCustomInput] = useState("");
  const [customStyles, setCustomStyles] = useState<string[]>([]);

  const handleUseLocation = async () => {
    try {
      const pos = await getCurrentPosition();
      const cityName = await reverseGeocode(pos.lat, pos.lon);
      const loc = { lat: pos.lat, lon: pos.lon, name: cityName };
      setPendingLocation(loc);
      updateSettings({ location: loc });
      trackEvent("location_set", { city: cityName, lat: pos.lat, lon: pos.lon, method: "gps" });
      setStep("style");
    } catch {
      setStep("search");
    }
  };

  const handleSelectCity = (city: any) => {
    const cityName = `${city.name}${city.admin1 ? `, ${city.admin1}` : ""}`;
    const loc = { lat: city.latitude, lon: city.longitude, name: cityName };
    setPendingLocation(loc);
    updateSettings({ location: loc });
    trackEvent("location_set", { city: cityName, lat: city.latitude, lon: city.longitude, method: "search" });
    setStep("style");
  };

  const toggleStyle = (s: string) => {
    setSelectedStyles(prev =>
      prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
    );
  };

  const addCustomStyle = () => {
    const trimmed = customInput.trim();
    if (!trimmed) return;
    const normalized = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
    if (!customStyles.includes(normalized) && !selectedStyles.includes(normalized)) {
      setCustomStyles(prev => [...prev, normalized]);
      setSelectedStyles(prev => [...prev, normalized]);
    }
    setCustomInput("");
  };

  const removeCustomStyle = (s: string) => {
    setCustomStyles(prev => prev.filter(x => x !== s));
    setSelectedStyles(prev => prev.filter(x => x !== s));
  };

  const handleFinish = () => {
    const allStyles = [...new Set([...selectedStyles])];
    updateSettings({ styleTypes: allStyles, onboarded: true });
    trackEvent("style_changed", { styleTypes: allStyles });
    navigate("/");
  };

  const handleSkipStyle = () => {
    updateSettings({ onboarded: true });
    navigate("/");
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-gradient-to-b from-primary/10 via-background to-background dark:from-primary/5 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <AnimatePresence mode="wait">

        {/* ── Welcome ── */}
        {step === "welcome" && (
          <motion.div
            key="welcome"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.4 }}
            className="flex-1 flex flex-col items-center justify-center p-6 text-center"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="relative mb-10"
            >
              <motion.div
                animate={{ opacity: [0.4, 0.7, 0.4], scale: [0.9, 1.1, 0.9] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -inset-8 brand-glow -z-10 rounded-full"
              />
              <img src="/logo.png" alt="Fit Check" className="w-32 h-32 rounded-[2rem] drop-shadow-2xl object-cover" />
            </motion.div>

            <div className="space-y-3 mb-10">
              <h1 className="text-5xl font-display font-black tracking-tighter brand-gradient-text">
                {"Fit Check".split("").map((c, i) => (
                  <motion.span key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.05 }}>
                    {c}
                  </motion.span>
                ))}
              </h1>
              <motion.p
                className="text-lg text-muted-foreground font-medium"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                What to wear, based on the weather.
              </motion.p>
            </div>

            <motion.div
              className="w-full max-w-sm space-y-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
            >
              <Button
                size="lg"
                className="w-full h-14 text-base rounded-2xl shadow-lg shadow-primary/20"
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
                onClick={() => setStep("search")}
                disabled={geoLoading}
              >
                Search by city
                <ArrowRight className="ml-2 h-4 w-4 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </Button>
            </motion.div>
          </motion.div>
        )}

        {/* ── City search ── */}
        {step === "search" && (
          <motion.div
            key="search"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.4 }}
            className="flex-1 flex flex-col justify-center p-6 max-w-sm mx-auto w-full"
          >
            <div className="mb-6">
              <h2 className="text-3xl font-display font-bold mb-2">Where are you?</h2>
              <p className="text-muted-foreground">Find your city to get local weather.</p>
            </div>
            <CitySearch onSelect={handleSelectCity} onCancel={() => setStep("welcome")} autoFocus />
          </motion.div>
        )}

        {/* ── Style picker ── */}
        {step === "style" && (
          <motion.div
            key="style"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.4 }}
            className="flex-1 flex flex-col min-h-[100dvh]"
          >
            {/* Sticky header */}
            <div className="px-5 pt-12 pb-4 sticky top-0 bg-gradient-to-b from-background via-background to-transparent z-10">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-primary" />
                </div>
                <h2 className="text-2xl font-display font-bold">Your Style</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                Pick any that feel like you. This helps personalize your outfits.
              </p>
              {selectedStyles.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 flex items-center gap-2"
                >
                  <Check className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs font-semibold text-primary">
                    {selectedStyles.length} selected
                  </span>
                </motion.div>
              )}
            </div>

            {/* Scrollable style grid */}
            <div className="flex-1 overflow-y-auto px-5 pb-4">
              <div className="flex flex-wrap gap-2 pb-2">
                {[...STYLE_TYPES].map(s => {
                  const active = selectedStyles.includes(s);
                  return (
                    <motion.button
                      key={s}
                      onClick={() => toggleStyle(s)}
                      whileTap={{ scale: 0.93 }}
                      className={`px-3.5 py-2 rounded-full text-sm font-semibold border-2 transition-all ${
                        active
                          ? "border-primary bg-primary text-primary-foreground shadow-sm"
                          : "border-border/60 bg-card text-foreground/70 hover:border-primary/40"
                      }`}
                    >
                      {s}
                    </motion.button>
                  );
                })}
              </div>

              {/* Custom styles */}
              {customStyles.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-1">
                  {customStyles.map(s => (
                    <span
                      key={s}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-semibold border-2 border-primary bg-primary text-primary-foreground"
                    >
                      {s}
                      <button onClick={() => removeCustomStyle(s)} className="opacity-70 hover:opacity-100">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Custom input */}
              <div className="mt-4 mb-2">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                  Don't see yours? Add it
                </p>
                <div className="flex gap-2">
                  <input
                    value={customInput}
                    onChange={e => setCustomInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addCustomStyle(); } }}
                    placeholder="e.g. Cottagecore, Y2K..."
                    className="flex-1 h-11 px-4 rounded-2xl border-2 border-border/60 bg-card text-sm focus:border-primary focus:outline-none transition-colors"
                  />
                  <button
                    onClick={addCustomStyle}
                    disabled={!customInput.trim()}
                    className="w-11 h-11 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40 transition-opacity shrink-0"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-5 border-t border-border/30 bg-background space-y-3 pb-10">
              <Button
                size="lg"
                className="w-full h-14 text-base rounded-2xl shadow-lg shadow-primary/20"
                onClick={handleFinish}
                disabled={selectedStyles.length === 0}
              >
                {selectedStyles.length > 0
                  ? `Continue with ${selectedStyles.length} style${selectedStyles.length > 1 ? "s" : ""}`
                  : "Select at least one style"}
              </Button>
              <button
                onClick={handleSkipStyle}
                className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
              >
                Skip for now
              </button>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
