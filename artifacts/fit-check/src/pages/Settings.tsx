import { useState } from "react";
import { useFitCheckSettings } from "@/hooks/useFitCheckSettings";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { trackEvent } from "@/lib/analytics";
import { STYLE_TYPES, GenderPreference } from "@/lib/storage";
import { MapPin, RefreshCw, Sun, Moon, Laptop, Thermometer, Trash2, Copy, Mic, Play, BellRing, CheckCircle2, Sparkles, Plus, X, User, Check, MessageSquare, Download, Share, Smartphone } from "lucide-react";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useLocation } from "wouter";
import { CitySearch } from "@/components/CitySearch";
import { motion, AnimatePresence } from "framer-motion";
import { reverseGeocode } from "@/lib/weather";
import { useToast } from "@/hooks/use-toast";
import { useVoiceAssistant } from "@/hooks/useVoiceAssistant";
import { useVoices } from "@/hooks/useVoices";
import { Switch } from "@/components/ui/switch";
import { registerServiceWorker } from "@/lib/swRegister";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";
import { subscribeToPush, sendSubscriptionToServer, unsubscribeFromPush } from "@/lib/pushSubscribe";
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
  const [showStylePicker, setShowStylePicker] = useState(false);
  const [customStyleInput, setCustomStyleInput] = useState("");
  const { toast } = useToast();
  const { speak, isSpeaking, cancelSpeech } = useVoiceAssistant();
  const { ranked: rankedVoices, loading: voicesLoading } = useVoices();
  const { canInstall, installed, ios, promptAvailable, install } = useInstallPrompt();
  const [iosHintVisible, setIosHintVisible] = useState(false);
  
  const handleTestVoice = (voiceId?: string | null) => {
    if (isSpeaking) {
      cancelSpeech();
      return;
    }
    speak("Hi, I'm your FIT CHECK assistant. Today looks like a great day to layer up.", voiceId ?? settings.voiceName);
  };

  const handleUpdateLocation = async () => {
    try {
      const pos = await getCurrentPosition();
      const resolvedCity = await reverseGeocode(pos.lat, pos.lon);
      updateSettings({
        location: {
          lat: pos.lat,
          lon: pos.lon,
          name: resolvedCity ?? "Current Location",
        }
      });
      if (resolvedCity) {
        trackEvent("location_set", { city: resolvedCity, lat: pos.lat, lon: pos.lon, method: "gps" });
      }
    } catch (e) {
      console.error(e);
      setShowCitySearch(true);
    }
  };

  const handleSelectCity = (city: any) => {
    const cityName = `${city.name}${city.admin1 ? `, ${city.admin1}` : ''}`;
    updateSettings({
      location: {
        lat: city.latitude,
        lon: city.longitude,
        name: cityName
      }
    });
    trackEvent("location_set", { city: cityName, lat: city.latitude, lon: city.longitude, method: "search" });
    setShowCitySearch(false);
  };

  const toggleStyleType = (s: string) => {
    const current = settings.styleTypes ?? [];
    const updated = current.includes(s) ? current.filter(x => x !== s) : [...current, s];
    updateSettings({ styleTypes: updated });
    trackEvent("style_changed", { styleTypes: updated });
  };

  const addCustomStyleType = () => {
    const trimmed = customStyleInput.trim();
    if (!trimmed) return;
    const normalized = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
    const current = settings.styleTypes ?? [];
    if (!current.includes(normalized)) {
      const updated = [...current, normalized];
      updateSettings({ styleTypes: updated });
      trackEvent("style_changed", { styleTypes: updated });
    }
    setCustomStyleInput("");
  };

  const handleToggleNotifications = async (checked: boolean) => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      toast({ title: "Notifications not supported on this browser", variant: "destructive" });
      return;
    }

    try {
      if (checked) {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          toast({ title: "Permission denied", description: "Please enable notifications in your browser settings.", variant: "destructive" });
          return;
        }
        
        const reg = await registerServiceWorker();
        if (!reg) throw new Error("Service worker registration failed");
        
        const sub = await subscribeToPush(reg);
        if (!sub) throw new Error("Failed to subscribe");
        
        await sendSubscriptionToServer(sub);
        updateSettings({ notificationsEnabled: true });
        toast({ title: "Notifications enabled!" });
      } else {
        const reg = await navigator.serviceWorker.ready;
        await unsubscribeFromPush(reg);
        updateSettings({ notificationsEnabled: false });
        toast({ title: "Notifications disabled" });
      }
    } catch (e: any) {
      console.error(e);
      toast({ title: "Error toggling notifications", description: e.message, variant: "destructive" });
      // Revert optimism
      updateSettings({ notificationsEnabled: settings.notificationsEnabled });
    }
  };

  const handleTestNotification = async () => {
    try {
      const res = await fetch('/api/push/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: "This is a test from FIT✔️!" })
      });
      if (res.ok) {
        toast({ title: "Test notification sent!" });
      } else {
        throw new Error("Failed to send");
      }
    } catch (e) {
      toast({ title: "Error sending test notification", variant: "destructive" });
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-6 space-y-8 pb-6"
    >
      <div className="flex items-center gap-4 mb-2">
        <img src="/logo.png" alt="Logo" className="w-10 h-10 rounded-xl shadow-sm" />
        <div>
          <h1 className="text-4xl font-display font-bold"><span className="brand-gradient-text">Set</span>tings</h1>
          <p className="text-muted-foreground font-medium">Manage your preferences and location.</p>
        </div>
      </div>

      {/* Install App */}
      {!installed && (
        <section className="space-y-4">
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider pl-2">Install App</h2>
          <div className="bg-card rounded-[2rem] border shadow-sm p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-xl text-primary shrink-0">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold">Add to Home Screen</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {ios
                    ? "Open directly from your home screen — no browser needed."
                    : promptAvailable
                    ? "Install the app for quick access right from your home screen."
                    : "Open this page in Chrome to install the app on your phone."}
                </p>
              </div>
            </div>

            {ios ? (
              <>
                <button
                  onClick={() => setIosHintVisible(!iosHintVisible)}
                  className="w-full h-12 rounded-2xl bg-primary text-primary-foreground text-sm font-semibold flex items-center justify-center gap-2"
                >
                  <Share className="w-4 h-4" />
                  How to Install on iPhone
                </button>
                <AnimatePresence>
                  {iosHintVisible && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="bg-muted/50 rounded-2xl p-4 space-y-2 text-sm">
                        <p className="font-semibold text-center mb-3">3 quick steps</p>
                        <div className="flex items-start gap-3">
                          <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shrink-0">1</span>
                          <p>Tap the <strong>Share</strong> button at the bottom of Safari <span className="text-muted-foreground">(box with arrow pointing up)</span></p>
                        </div>
                        <div className="flex items-start gap-3">
                          <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shrink-0">2</span>
                          <p>Scroll down and tap <strong>"Add to Home Screen"</strong></p>
                        </div>
                        <div className="flex items-start gap-3">
                          <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shrink-0">3</span>
                          <p>Tap <strong>"Add"</strong> in the top right — done!</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            ) : promptAvailable ? (
              <button
                onClick={async () => {
                  await install();
                  trackEvent("install_tapped_settings", {});
                }}
                className="w-full h-12 rounded-2xl bg-primary text-primary-foreground text-sm font-semibold flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Install App
              </button>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-1">
                Open this app in <strong>Chrome</strong> on Android to install it.
              </p>
            )}
          </div>
        </section>
      )}

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

      {/* Style Types */}
      <section className="space-y-4">
        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider pl-2">My Style</h2>
        <div className="bg-card rounded-[2rem] border shadow-sm overflow-hidden">
          {/* Current styles summary */}
          <div className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-primary/10 rounded-xl text-primary">
                  <Sparkles className="w-4 h-4" />
                </div>
                <p className="text-sm font-bold">Style Vibes</p>
              </div>
              <button
                onClick={() => setShowStylePicker(v => !v)}
                className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
              >
                {showStylePicker ? "Done" : "Edit"}
              </button>
            </div>

            {(settings.styleTypes ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No styles selected.{" "}
                <button onClick={() => setShowStylePicker(true)} className="text-primary font-semibold underline-offset-2 hover:underline">
                  Add some
                </button>
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {(settings.styleTypes ?? []).map(s => (
                  <span key={s} className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                    {s}
                    {showStylePicker && (
                      <button onClick={() => toggleStyleType(s)} className="opacity-60 hover:opacity-100 ml-0.5">
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Expanded picker */}
          <AnimatePresence>
            {showStylePicker && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden border-t border-border/40"
              >
                <div className="p-5 space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {[...STYLE_TYPES].map(s => {
                      const active = (settings.styleTypes ?? []).includes(s);
                      return (
                        <button
                          key={s}
                          onClick={() => toggleStyleType(s)}
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold border-2 transition-all ${
                            active
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border/60 bg-background text-foreground/70 hover:border-primary/40"
                          }`}
                        >
                          {s}
                        </button>
                      );
                    })}
                  </div>

                  {/* Custom style input */}
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Add your own</p>
                    <div className="flex gap-2">
                      <input
                        value={customStyleInput}
                        onChange={e => setCustomStyleInput(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addCustomStyleType(); } }}
                        placeholder="e.g. Cottagecore, Y2K..."
                        className="flex-1 h-10 px-3 rounded-xl border-2 border-border/60 bg-background text-sm focus:border-primary focus:outline-none transition-colors"
                      />
                      <button
                        onClick={addCustomStyleType}
                        disabled={!customStyleInput.trim()}
                        className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40 shrink-0"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* Gender / Wardrobe */}
      <section className="space-y-4">
        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider pl-2">Wardrobe Style</h2>
        <div className="bg-card rounded-[2rem] border shadow-sm p-5 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 bg-primary/10 rounded-xl text-primary">
              <User className="w-4 h-4" />
            </div>
            <p className="text-sm font-bold">Clothing suggestions for</p>
          </div>
          <div className="flex gap-2">
            {([
              { value: "female", label: "Women's", emoji: "👗" },
              { value: "male", label: "Men's", emoji: "👔" },
              { value: "unspecified", label: "Any", emoji: "✨" },
            ] as { value: GenderPreference; label: string; emoji: string }[]).map(opt => {
              const active = (settings.gender ?? "unspecified") === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => {
                    updateSettings({ gender: opt.value });
                    trackEvent("gender_changed", { gender: opt.value });
                  }}
                  className={`flex-1 flex flex-col items-center gap-1 py-3 px-2 rounded-2xl border-2 text-center transition-all text-sm font-semibold ${
                    active
                      ? "border-primary bg-primary/8 text-primary"
                      : "border-border/60 bg-background text-foreground/70 hover:border-primary/40"
                  }`}
                >
                  <span className="text-xl">{opt.emoji}</span>
                  <span className="text-xs">{opt.label}</span>
                  {active && <Check className="w-3 h-3" />}
                </button>
              );
            })}
          </div>
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

      <section className="space-y-4">
        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider pl-2">Notifications</h2>
        <div className="bg-card rounded-[2rem] border shadow-sm p-5 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-pink-500/10 rounded-xl text-pink-500">
                <BellRing className="w-5 h-5" />
              </div>
              <div>
                <Label className="text-base font-semibold">Daily outfit alert</Label>
                <p className="text-xs text-muted-foreground">Get a morning summary</p>
              </div>
            </div>
            <Switch 
              checked={settings.notificationsEnabled} 
              onCheckedChange={handleToggleNotifications} 
            />
          </div>

          <AnimatePresence>
            {settings.notificationsEnabled && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4 pt-2 overflow-hidden border-t"
              >
                <div className="flex items-center justify-between pt-2">
                  <Label className="text-sm font-medium">Alert time</Label>
                  <input 
                    type="time" 
                    value={settings.morningAlertTime || "08:00"}
                    onChange={(e) => updateSettings({ morningAlertTime: e.target.value })}
                    className="bg-muted text-foreground border-none rounded-xl px-3 py-1.5 text-sm font-semibold focus:ring-primary"
                  />
                </div>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full rounded-xl"
                  onClick={handleTestNotification}
                >
                  <CheckCircle2 className="w-4 h-4 mr-2 text-green-500" />
                  Send test notification
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider pl-2">Voice</h2>
        <div className="bg-card rounded-[2rem] border shadow-sm p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 rounded-xl text-amber-600">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <Label className="text-base font-semibold">Assistant voice</Label>
              <p className="text-xs text-muted-foreground">Pick the voice that reads responses aloud.</p>
            </div>
          </div>

          {voicesLoading || rankedVoices.length === 0 ? (
            <p className="text-sm text-muted-foreground bg-muted/30 rounded-xl p-4 text-center">
              Loading voices from your device...
            </p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1 -mr-1">
              {/* Auto option */}
              {(() => {
                const isActive = !settings.voiceName;
                return (
                  <div
                    onClick={() => updateSettings({ voiceName: null })}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-2xl border-2 cursor-pointer transition-all",
                      isActive ? "border-primary bg-primary/5" : "border-transparent bg-muted/30 hover:bg-muted/50"
                    )}
                  >
                    <div className={cn(
                      "w-9 h-9 rounded-full flex items-center justify-center font-display font-bold text-sm shrink-0",
                      isActive ? "bg-primary text-primary-foreground" : "bg-background text-foreground"
                    )}>
                      A
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm leading-tight">Auto</p>
                      <p className="text-xs text-muted-foreground truncate">Best voice your device has</p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleTestVoice(null); }}
                      className="w-9 h-9 rounded-full bg-background border flex items-center justify-center hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors shrink-0"
                      aria-label="Preview"
                    >
                      <Play className="w-4 h-4" />
                    </button>
                  </div>
                );
              })()}

              {rankedVoices.map(rv => {
                const isActive = settings.voiceName === rv.voice.name;
                return (
                  <div
                    key={rv.voice.name}
                    onClick={() => updateSettings({ voiceName: rv.voice.name })}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-2xl border-2 cursor-pointer transition-all",
                      isActive ? "border-primary bg-primary/5" : "border-transparent bg-muted/30 hover:bg-muted/50"
                    )}
                  >
                    <div className={cn(
                      "w-9 h-9 rounded-full flex items-center justify-center font-display font-bold text-sm shrink-0",
                      isActive ? "bg-primary text-primary-foreground" : "bg-background text-foreground"
                    )}>
                      {rv.label[0]?.toUpperCase() ?? "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm leading-tight truncate">{rv.label}</p>
                        {rv.quality === "premium" && (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 shrink-0">
                            Premium
                          </span>
                        )}
                        {rv.quality === "enhanced" && (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-blue-500/15 text-blue-700 dark:text-blue-400 shrink-0">
                            Enhanced
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{rv.sublabel}</p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleTestVoice(rv.voice.name); }}
                      className="w-9 h-9 rounded-full bg-background border flex items-center justify-center hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors shrink-0"
                      aria-label={`Preview ${rv.label}`}
                    >
                      <Play className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
          
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-3">
            <p className="text-xs text-muted-foreground leading-relaxed">
              <strong className="text-foreground">Tip:</strong> The most natural voices are marked Premium. On iPhone, download more in Settings → Accessibility → Spoken Content → Voices (look for "Siri" or "Enhanced" voices). On Mac, check System Settings → Accessibility → Spoken Content.
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider pl-2">Use with Siri</h2>
        <div className="bg-card rounded-[2rem] border shadow-sm p-5 space-y-4">
          <p className="text-sm text-muted-foreground">
            Want to ask Siri what to wear? On your iPhone, open the Shortcuts app and create a shortcut that opens this URL. Then say "Hey Siri, what should I wear?" to launch FIT✔️ instantly.
          </p>
          <div className="flex items-center gap-2 bg-muted p-3 rounded-xl overflow-hidden">
            <code className="text-xs flex-1 truncate">{window.location.origin}/?voice=1</code>
            <Button variant="secondary" size="sm" onClick={() => {
              navigator.clipboard.writeText(`${window.location.origin}/?voice=1`);
              toast({ title: "Copied!" });
            }}>
              <Copy className="w-4 h-4" />
            </Button>
          </div>
          <ol className="text-sm text-muted-foreground list-decimal pl-4 space-y-2">
            <li>Open the Shortcuts app on iPhone.</li>
            <li>Tap the + to create a new shortcut.</li>
            <li>Add the action "Open URL" and paste the URL above.</li>
            <li>Tap the settings icon and add to Siri with phrase "What should I wear?"</li>
          </ol>
        </div>
      </section>

      {/* Feedback */}
      <section className="space-y-4">
        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider pl-2">Feedback</h2>
        <div className="bg-card rounded-[2rem] border shadow-sm p-5 space-y-3">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-primary/10 rounded-xl text-primary shrink-0 mt-0.5">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-semibold">Share your thoughts</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Got a suggestion, spotted a bug, or just want to say hi? We'd love to hear from you.
              </p>
            </div>
          </div>
          <a
            href="mailto:fitcheckfeedback@gmail.com?subject=FIT%20Feedback"
            className="flex items-center justify-center gap-2 w-full h-12 rounded-2xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
            onClick={() => trackEvent("feedback_tapped", {})}
          >
            <MessageSquare className="w-4 h-4" />
            Send Feedback
          </a>
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
