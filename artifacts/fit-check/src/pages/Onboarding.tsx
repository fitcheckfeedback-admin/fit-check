import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { MapPin, ArrowRight, RefreshCw, Sparkles, User, Check, Plus, X, Lock, ChevronDown } from "lucide-react";
import { CitySearch } from "@/components/CitySearch";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useFitCheckSettings } from "@/hooks/useFitCheckSettings";
import { trackEvent } from "@/lib/analytics";
import { STYLE_TYPES, GenderPreference } from "@/lib/storage";
import { reverseGeocode } from "@/lib/weather";

type Step = "hook" | "requesting" | "denied" | "style" | "gender";

const SCENARIOS = [
  {
    weather: "Sunny",
    temp: "26°C",
    emoji: "☀️",
    gradient: "from-amber-400/40 via-orange-300/20 to-transparent",
    dot: "bg-amber-400",
    accentText: "text-amber-600",
    accentPill: "bg-amber-500/12 text-amber-700 border-amber-400/30",
    title: "The Weekend Look",
    vibe: "Light · Effortless · On-point",
    items: ["Linen Shirt", "Slim Chinos", "White Sneakers"],
  },
  {
    weather: "Rainy",
    temp: "13°C",
    emoji: "🌧️",
    gradient: "from-blue-500/40 via-slate-400/20 to-transparent",
    dot: "bg-blue-400",
    accentText: "text-blue-600",
    accentPill: "bg-blue-500/12 text-blue-700 border-blue-400/30",
    title: "The Layered Edit",
    vibe: "Chic · Protected · Ready",
    items: ["Waterproof Mac", "Dark Jeans", "Chelsea Boots"],
  },
  {
    weather: "Cold",
    temp: "3°C",
    emoji: "❄️",
    gradient: "from-indigo-500/40 via-slate-500/20 to-transparent",
    dot: "bg-indigo-400",
    accentText: "text-indigo-600",
    accentPill: "bg-indigo-500/12 text-indigo-700 border-indigo-400/30",
    title: "The Cozy Stack",
    vibe: "Warm · Bold · Wrapped up",
    items: ["Wool Overcoat", "Chunky Knit", "Thermal Jeans", "Snow Boots"],
  },
  {
    weather: "Mild",
    temp: "19°C",
    emoji: "🌤️",
    gradient: "from-teal-400/40 via-emerald-300/20 to-transparent",
    dot: "bg-teal-400",
    accentText: "text-teal-600",
    accentPill: "bg-teal-500/12 text-teal-700 border-teal-400/30",
    title: "The Classic Fit",
    vibe: "Smart · Relaxed · Versatile",
    items: ["Cotton Shirt", "Tailored Trousers", "Leather Loafers"],
  },
];

function OutfitShowcase() {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);

  useEffect(() => {
    const t = setInterval(() => {
      setDirection(1);
      setIndex(i => (i + 1) % SCENARIOS.length);
    }, 3000);
    return () => clearInterval(t);
  }, []);

  const s = SCENARIOS[index];

  return (
    <div className="relative w-full px-5">
      {/* Glow behind card */}
      <motion.div
        key={`glow-${index}`}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className={`absolute inset-4 rounded-3xl blur-2xl bg-gradient-to-br ${s.gradient} -z-10`}
      />

      {/* Card */}
      <div className="relative rounded-3xl overflow-hidden border border-white/40 bg-white/80 dark:bg-card/90 backdrop-blur-xl shadow-2xl shadow-black/10">

        {/* Weather header */}
        <div className={`relative px-5 pt-5 pb-4 bg-gradient-to-br ${s.gradient}`}>
          <div className="flex items-start justify-between">
            <div>
              <AnimatePresence mode="wait">
                <motion.p
                  key={`weather-${index}`}
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={{ duration: 0.22 }}
                  className={`text-[11px] font-black uppercase tracking-widest ${s.accentText} mb-1`}
                >
                  {s.weather}
                </motion.p>
              </AnimatePresence>
              <AnimatePresence mode="wait">
                <motion.p
                  key={`temp-${index}`}
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.1 }}
                  transition={{ duration: 0.25 }}
                  className="text-4xl font-black tracking-tighter text-foreground"
                >
                  {s.temp}
                </motion.p>
              </AnimatePresence>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={`emoji-${index}`}
                initial={{ scale: 0.4, opacity: 0, rotate: -20 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                exit={{ scale: 1.4, opacity: 0, rotate: 20 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="text-5xl"
              >
                {s.emoji}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Outfit section */}
        <div className="px-5 pt-4 pb-5">
          <div className="flex items-center gap-1.5 mb-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Today's Fit</span>
            <span className="text-[10px]">✨</span>
          </div>

          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={`outfit-${index}`}
              custom={direction}
              initial={{ opacity: 0, x: direction * 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -30 }}
              transition={{ duration: 0.28, ease: "easeOut" }}
            >
              <p className="text-xl font-display font-bold tracking-tight text-foreground mb-0.5">
                {s.title}
              </p>
              <p className="text-xs text-muted-foreground mb-3">{s.vibe}</p>

              <div className="flex flex-wrap gap-1.5">
                {s.items.map((item, i) => (
                  <motion.span
                    key={item}
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.06, type: "spring", stiffness: 300 }}
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${s.accentPill}`}
                  >
                    {item}
                  </motion.span>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Progress dots */}
          <div className="flex items-center gap-1.5 mt-4">
            {SCENARIOS.map((sc, i) => (
              <motion.div
                key={i}
                animate={{ width: i === index ? 20 : 6, opacity: i === index ? 1 : 0.3 }}
                transition={{ duration: 0.3 }}
                className={`h-1.5 rounded-full ${sc.dot}`}
              />
            ))}
            <span className="ml-auto text-[10px] text-muted-foreground/50 font-medium">
              {index + 1}/{SCENARIOS.length}
            </span>
          </div>
        </div>
      </div>

      {/* Tease below card */}
      <motion.p
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className="text-center text-sm font-semibold text-muted-foreground mt-4"
      >
        What's yours today? →
      </motion.p>
    </div>
  );
}

export default function Onboarding() {
  const [, navigate] = useLocation();
  const { updateSettings } = useFitCheckSettings();
  const { getCurrentPosition, loading: geoLoading } = useGeolocation();

  const fromLanding = new URLSearchParams(window.location.search).get("src") === "landing";
  const [step, setStep] = useState<Step>(fromLanding ? "requesting" : "hook");
  const [showCitySearch, setShowCitySearch] = useState(false);
  const [showBrowserInstructions, setShowBrowserInstructions] = useState(false);
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [customInput, setCustomInput] = useState("");
  const [customStyles, setCustomStyles] = useState<string[]>([]);
  const [selectedGender, setSelectedGender] = useState<GenderPreference>("unspecified");

  const handleCitySelect = (city: any) => {
    const loc = { lat: city.lat, lon: city.lon, name: city.name };
    updateSettings({ location: loc });
    trackEvent("location_set", { city: city.name, lat: city.lat, lon: city.lon, method: "city_search" });
    setStep("style");
  };

  const requestLocation = async () => {
    setStep("requesting");
    try {
      const pos = await getCurrentPosition();
      const resolvedCity = await reverseGeocode(pos.lat, pos.lon);
      const loc = { lat: pos.lat, lon: pos.lon, name: resolvedCity ?? "Current Location" };
      updateSettings({ location: loc });
      if (resolvedCity) {
        trackEvent("location_set", { city: resolvedCity, lat: pos.lat, lon: pos.lon, method: "gps" });
      }
      setStep("style");
    } catch {
      setStep("denied");
    }
  };

  useEffect(() => {
    if (fromLanding) {
      requestLocation();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    updateSettings({ styleTypes: allStyles });
    trackEvent("style_changed", { styleTypes: allStyles });
    setStep("gender");
  };

  const handleFinishGender = () => {
    updateSettings({ gender: selectedGender, onboarded: true });
    trackEvent("gender_set", { gender: selectedGender });
    sessionStorage.setItem("fitcheck.sessionTracked", "1");
    trackEvent("app_open", { referrer: document.referrer || undefined });
    navigate("/");
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-gradient-to-b from-primary/8 via-background to-background dark:from-primary/5 relative overflow-hidden">
      <div className="absolute top-[-15%] right-[-15%] w-80 h-80 bg-primary/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-72 h-72 bg-blue-500/8 rounded-full blur-3xl pointer-events-none" />

      <AnimatePresence mode="wait">

        {/* ── Hook / value-prop screen ── */}
        {step === "hook" && (
          <motion.div
            key="hook"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.35 }}
            className="flex-1 flex flex-col min-h-[100dvh]"
          >
            {/* Top: logo + headline */}
            <div className="px-6 pt-12 pb-6 text-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.05, type: "spring", stiffness: 280, damping: 22 }}
                className="inline-block mb-5"
              >
                <img
                  src="/logo.png"
                  alt="FIT✔️"
                  className="w-16 h-16 rounded-[1.1rem] drop-shadow-xl object-cover mx-auto"
                />
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="text-[1.75rem] font-display font-black tracking-tight leading-tight brand-gradient-text mb-2"
              >
                Know exactly what<br />to wear. Every day.
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.25 }}
                className="text-sm text-muted-foreground leading-relaxed"
              >
                Your AI stylist reads the live weather<br />and picks your outfit before you get dressed.
              </motion.p>
            </div>

            {/* Animated showcase — the hero */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 180, damping: 22 }}
              className="flex-1 flex flex-col justify-center"
            >
              <OutfitShowcase />
            </motion.div>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 }}
              className="px-5 pt-4 pb-10 space-y-2.5"
            >
              <Button
                size="lg"
                className="w-full h-14 text-base font-bold rounded-2xl shadow-xl shadow-primary/30 relative overflow-hidden group"
                onClick={requestLocation}
              >
                <motion.span
                  className="absolute inset-0 bg-white/10"
                  initial={{ x: "-100%" }}
                  animate={{ x: "200%" }}
                  transition={{ duration: 1.8, repeat: Infinity, repeatDelay: 2, ease: "easeInOut" }}
                />
                Get My Daily FIT✔️
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-0.5 transition-transform" />
              </Button>
              <p className="text-center text-xs text-muted-foreground/70">
                Free forever · Needs your location to get started
              </p>
            </motion.div>
          </motion.div>
        )}

        {/* ── Requesting location ── */}
        {step === "requesting" && (
          <motion.div
            key="requesting"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.4 }}
            className="flex-1 flex flex-col items-center justify-center p-6 text-center"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, type: "spring" }}
              className="relative mb-10"
            >
              <motion.div
                animate={{ opacity: [0.4, 0.7, 0.4], scale: [0.9, 1.1, 0.9] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -inset-8 brand-glow -z-10 rounded-full"
              />
              <img src="/logo.png" alt="FIT✔️" className="w-32 h-32 rounded-[2rem] drop-shadow-2xl object-cover" />
            </motion.div>

            <div className="w-full max-w-sm space-y-3">
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-primary/8 border border-primary/20">
                <motion.div
                  animate={{ rotate: geoLoading ? 360 : 0 }}
                  transition={{ repeat: geoLoading ? Infinity : 0, duration: 1, ease: "linear" }}
                >
                  <MapPin className="w-5 h-5 text-primary shrink-0" />
                </motion.div>
                <p className="text-sm text-left text-foreground/80">
                  {geoLoading ? "Getting your location…" : "Requesting your location…"}
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                Tap <strong>Allow</strong> when your browser asks for location access.
              </p>
            </div>
          </motion.div>
        )}

        {/* ── Location denied ── */}
        {step === "denied" && (
          <motion.div
            key="denied"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.4 }}
            className="flex-1 flex flex-col p-6 pt-14 min-h-[100dvh]"
          >
            {/* Privacy reassurance header */}
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 mx-auto">
                <Lock className="w-7 h-7 text-primary" />
              </div>
              <h2 className="text-2xl font-display font-bold mb-2">We get it</h2>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
                Location access is <strong>only for this app</strong> — not shared with other sites. Your browser keeps each site's permissions completely separate.
              </p>
            </div>

            {/* Option A: Try GPS again */}
            <div className="space-y-3 mb-4">
              <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/60 px-1">Option 1 — Use GPS (most accurate)</p>
              <Button
                size="lg"
                className="w-full h-14 text-base rounded-2xl shadow-lg shadow-primary/20"
                onClick={() => window.location.reload()}
              >
                <RefreshCw className="mr-2 h-5 w-5" />
                Reload &amp; Try Again
              </Button>
              <p className="text-center text-xs text-muted-foreground/60 px-2">
                After changing your browser or system settings, a reload is needed to pick up the new permission.
              </p>

              {/* Collapsible instructions */}
              <button
                onClick={() => setShowBrowserInstructions(v => !v)}
                className="w-full text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors flex items-center justify-center gap-1 py-1"
              >
                <motion.span animate={{ rotate: showBrowserInstructions ? 180 : 0 }} transition={{ duration: 0.2 }}>
                  <ChevronDown className="w-3 h-3" />
                </motion.span>
                How to enable in browser settings
              </button>
              <AnimatePresence>
                {showBrowserInstructions && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 rounded-2xl bg-muted/50 text-left space-y-2">
                      <p className="text-xs text-muted-foreground"><strong>iPhone Safari:</strong> Settings → Safari → Location → Allow</p>
                      <p className="text-xs text-muted-foreground"><strong>Android Chrome:</strong> Site settings → Location → Allow</p>
                      <p className="text-xs text-muted-foreground/70 mt-1">💡 Tip: set it to "Ask next time" so you're always in control.</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3 my-2">
              <div className="flex-1 h-px bg-border/50" />
              <span className="text-xs text-muted-foreground/50 font-medium">or</span>
              <div className="flex-1 h-px bg-border/50" />
            </div>

            {/* Option B: City search */}
            <div className="space-y-3">
              <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/60 px-1">Option 2 — Enter your city manually</p>
              <AnimatePresence mode="wait">
                {!showCitySearch ? (
                  <motion.button
                    key="show-search"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setShowCitySearch(true)}
                    className="w-full h-14 rounded-2xl border-2 border-border/60 bg-card text-sm font-semibold text-foreground/70 flex items-center justify-center gap-2 hover:border-primary/40 transition-colors"
                  >
                    <MapPin className="w-4 h-4" />
                    Enter my city instead
                  </motion.button>
                ) : (
                  <motion.div
                    key="city-search"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                  >
                    <CitySearch
                      onSelect={handleCitySelect}
                      onCancel={() => setShowCitySearch(false)}
                      autoFocus
                    />
                  </motion.div>
                )}
              </AnimatePresence>
              <p className="text-center text-xs text-muted-foreground/50">
                GPS gives you the most precise local weather.
              </p>
            </div>
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
            <div className="px-5 pt-12 pb-4 sticky top-0 bg-gradient-to-b from-background via-background to-transparent z-10">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-primary" />
                </div>
                <h2 className="text-2xl font-display font-bold">Your Style</h2>
              </div>
              <p className="text-sm text-muted-foreground">Pick any that feel like you. This helps personalize your outfits.</p>
              {selectedStyles.length > 0 && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="mt-2 flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs font-semibold text-primary">{selectedStyles.length} selected</span>
                </motion.div>
              )}
            </div>

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
                        active ? "border-primary bg-primary text-primary-foreground shadow-sm" : "border-border/60 bg-card text-foreground/70 hover:border-primary/40"
                      }`}
                    >
                      {s}
                    </motion.button>
                  );
                })}
              </div>

              {customStyles.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-1">
                  {customStyles.map(s => (
                    <span key={s} className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-semibold border-2 border-primary bg-primary text-primary-foreground">
                      {s}
                      <button onClick={() => removeCustomStyle(s)} className="opacity-70 hover:opacity-100"><X className="w-3.5 h-3.5" /></button>
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-4 mb-2">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Don't see yours? Add it</p>
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
              <button onClick={() => setStep("gender")} className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors py-2">
                Skip for now
              </button>
            </div>
          </motion.div>
        )}

        {/* ── Gender picker ── */}
        {step === "gender" && (
          <motion.div
            key="gender"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.4 }}
            className="flex-1 flex flex-col min-h-[100dvh]"
          >
            <div className="px-5 pt-12 pb-4">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                  <User className="w-4 h-4 text-primary" />
                </div>
                <h2 className="text-2xl font-display font-bold">Your Wardrobe</h2>
              </div>
              <p className="text-sm text-muted-foreground">This helps us suggest the right clothing options for you.</p>
            </div>

            <div className="flex-1 px-5 space-y-3 pt-2">
              {([
                { value: "female", label: "Women's", emoji: "👗", desc: "Dresses, skirts, blouses & more" },
                { value: "male",   label: "Men's",   emoji: "👔", desc: "Shirts, trousers, jackets & more" },
                { value: "unspecified", label: "No preference", emoji: "✨", desc: "Gender-neutral suggestions" },
              ] as { value: GenderPreference; label: string; emoji: string; desc: string }[]).map(opt => (
                <motion.button
                  key={opt.value}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setSelectedGender(opt.value)}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all ${
                    selectedGender === opt.value ? "border-primary bg-primary/8" : "border-border/60 bg-card hover:border-primary/40"
                  }`}
                >
                  <span className="text-3xl">{opt.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-base leading-tight">{opt.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{opt.desc}</p>
                  </div>
                  {selectedGender === opt.value && (
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5 text-primary-foreground" />
                    </div>
                  )}
                </motion.button>
              ))}
            </div>

            <div className="px-5 py-5 border-t border-border/30 bg-background space-y-3 pb-10 mt-6">
              <Button
                size="lg"
                className="w-full h-14 text-base rounded-2xl shadow-lg shadow-primary/20"
                onClick={handleFinishGender}
              >
                Let's go
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
