import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X, Share } from "lucide-react";

const DISMISSED_KEY = "fitcheck.installDismissed";
const DELAY_MS = 20000;

function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function isInStandaloneMode() {
  return window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as any).standalone === true;
}

export function InstallPrompt() {
  const [visible, setVisible] = useState(false);
  const [isIOSDevice, setIsIOSDevice] = useState(false);

  useEffect(() => {
    if (isInStandaloneMode()) return;
    if (localStorage.getItem(DISMISSED_KEY)) return;

    const ios = isIOS();
    setIsIOSDevice(ios);

    // Check if the event was already captured globally before React mounted
    const tryShow = () => {
      const hasAndroidPrompt = !!(window as any).__installPromptEvent;
      if (hasAndroidPrompt || ios) {
        setTimeout(() => setVisible(true), DELAY_MS);
      }
    };

    // If already captured, schedule now
    if ((window as any).__installPromptEvent) {
      tryShow();
      return;
    }

    // iOS — no beforeinstallprompt event, just schedule the hint
    if (ios) {
      tryShow();
      return;
    }

    // Android — wait for the global to signal it's ready
    const onReady = () => tryShow();
    window.addEventListener("installpromptready", onReady);
    return () => window.removeEventListener("installpromptready", onReady);
  }, []);

  const handleInstall = async () => {
    const prompt = (window as any).__installPromptEvent;
    if (!prompt) return;
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === "accepted") {
      (window as any).__installPromptEvent = null;
    }
    dismiss();
  };

  const dismiss = () => {
    localStorage.setItem(DISMISSED_KEY, "1");
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 80 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 80 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
          className="absolute bottom-24 left-3 right-3 z-[55] rounded-2xl bg-card border border-border/60 shadow-2xl shadow-black/20 p-4"
        >
          <button
            onClick={dismiss}
            className="absolute top-3 right-3 text-muted-foreground/60 hover:text-muted-foreground"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3 mb-3">
            <img
              src={`${import.meta.env.BASE_URL}icon-192.png`}
              alt="FIT✔️"
              className="w-10 h-10 rounded-xl"
            />
            <div>
              <p className="font-bold text-sm leading-tight">Add FIT✔️ to your Home Screen</p>
              <p className="text-xs text-muted-foreground">Get instant outfit checks, no browser needed</p>
            </div>
          </div>

          {isIOSDevice ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-xl p-3">
              <Share className="w-4 h-4 shrink-0 text-primary" />
              <span>Tap <strong>Share</strong> then <strong>"Add to Home Screen"</strong></span>
            </div>
          ) : (
            <button
              onClick={handleInstall}
              className="w-full h-10 rounded-xl bg-primary text-primary-foreground text-sm font-semibold flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              Add to Home Screen
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
