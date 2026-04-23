import { useState } from "react";
import { useLocation } from "wouter";
import { MapPin, ArrowRight, RefreshCw, Sparkles, User, Check, Plus, X, CloudSun, Shirt, Bell } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useFitCheckSettings } from "@/hooks/useFitCheckSettings";
import { trackEvent } from "@/lib/analytics";
import { STYLE_TYPES, GenderPreference } from "@/lib/storage";
import { reverseGeocode } from "@/lib/weather";

type Step = "hook" | "requesting" | "denied" | "style" | "gender";

const PERKS = [
  {
    icon: CloudSun,
    title: "Real weather, right now",
    body: "Live forecast for your exact location — not just your city.",
  },
  {
    icon: Shirt,
    title: "Outfit picked for you",
    body: "AI picks what to wear based on today's temperature and conditions.",
  },
  {
    icon: Bell,
    title: "Morning reminder",
    body: "Get your fit check before you even open your wardrobe.",
  },
];

export default function Onboarding() {
  const [, navigate] = useLocation();
  const { updateSettings } = useFitCheckSettings();
  const { getCurrentPosition, loading: geoLoading } = useGeolocation();

  const [step, setStep] = useState<Step>("hook");
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [customInput, setCustomInput] = useState("");
  const [customStyles, setCustomStyles] = useState<string[]>([]);
  const [selectedGender, setSelectedGender] = useState<GenderPreference>("unspecified");

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
    <div className="min-h-[100dvh] flex flex-col bg-gradient-to-b from-primary/10 via-background to-background dark:from-primary/5 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

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
            {/* Hero */}
            <div className="flex flex-col items-center pt-14 pb-8 px-6 text-center">
              <motion.div
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 260, damping: 20 }}
                className="relative mb-6"
              >
                <motion.div
                  animate={{ opacity: [0.4, 0.7, 0.4], scale: [0.9, 1.1, 0.9] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -inset-8 brand-glow -z-10 rounded-full"
                />
                <img
                  src="/logo.png"
                  alt="Fit Check"
                  className="w-24 h-24 rounded-[1.5rem] drop-shadow-2xl object-cover"
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="space-y-2 mb-2"
              >
                <h1 className="text-4xl font-display font-black tracking-tighter brand-gradient-text leading-tight">
                  Never stress about<br />what to wear again.
                </h1>
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-base text-muted-foreground leading-relaxed max-w-xs"
              >
                Fit Check reads your local weather every morning and tells you exactly what to put on.
              </motion.p>
            </div>

            {/* Perk cards */}
            <div className="flex-1 px-5 space-y-3">
              {PERKS.map((perk, i) => (
                <motion.div
                  key={perk.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.1, type: "spring", stiffness: 200 }}
                  className="flex items-start gap-4 p-4 rounded-2xl bg-card/80 border border-border/40 shadow-sm"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <perk.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm leading-tight mb-0.5">{perk.title}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{perk.body}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.85 }}
              className="px-5 pt-6 pb-10 space-y-3"
            >
              <Button
                size="lg"
                className="w-full h-14 text-base font-bold rounded-2xl shadow-lg shadow-primary/25"
                onClick={requestLocation}
              >
                Get My Daily Fit Check
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                Needs your location to show today's weather. Free forever.
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
              <img src="/logo.png" alt="Fit Check" className="w-32 h-32 rounded-[2rem] drop-shadow-2xl object-cover" />
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
            className="flex-1 flex flex-col items-center justify-center p-6 text-center"
          >
            <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mb-6">
              <MapPin className="w-9 h-9 text-destructive" />
            </div>

            <h2 className="text-2xl font-display font-bold mb-2">Location Required</h2>
            <p className="text-muted-foreground text-sm leading-relaxed mb-2 max-w-xs">
              Fit Check needs your location to show real-time weather and suggest what to wear today.
            </p>
            <p className="text-muted-foreground text-sm leading-relaxed mb-8 max-w-xs">
              If you denied access, open your browser's site settings and enable <strong>Location</strong>, then tap Try Again.
            </p>

            <div className="w-full max-w-sm space-y-3">
              <Button
                size="lg"
                className="w-full h-14 text-base rounded-2xl shadow-lg shadow-primary/20"
                onClick={requestLocation}
                disabled={geoLoading}
              >
                <RefreshCw className={`mr-2 h-5 w-5 ${geoLoading ? "animate-spin" : ""}`} />
                Try Again
              </Button>

              <div className="p-4 rounded-2xl bg-muted/50 text-left space-y-2">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">How to enable on mobile</p>
                <p className="text-xs text-muted-foreground">
                  <strong>iPhone:</strong> Settings → Safari → Location → Allow
                </p>
                <p className="text-xs text-muted-foreground">
                  <strong>Android:</strong> Settings → Apps → Browser → Permissions → Location → Allow
                </p>
              </div>
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
                onClick={() => setStep("gender")}
                className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
              >
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
              <p className="text-sm text-muted-foreground">
                This helps us suggest the right clothing options for you.
              </p>
            </div>

            <div className="flex-1 px-5 space-y-3 pt-2">
              {([
                { value: "female", label: "Women's", emoji: "👗", desc: "Dresses, skirts, blouses & more" },
                { value: "male", label: "Men's", emoji: "👔", desc: "Shirts, trousers, jackets & more" },
                { value: "unspecified", label: "No preference", emoji: "✨", desc: "Gender-neutral suggestions" },
              ] as { value: GenderPreference; label: string; emoji: string; desc: string }[]).map(opt => (
                <motion.button
                  key={opt.value}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setSelectedGender(opt.value)}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all ${
                    selectedGender === opt.value
                      ? "border-primary bg-primary/8"
                      : "border-border/60 bg-card hover:border-primary/40"
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
