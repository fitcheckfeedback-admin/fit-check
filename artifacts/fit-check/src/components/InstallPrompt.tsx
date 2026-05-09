import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X, Share } from "lucide-react";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";
import { isNative } from "@/lib/platform";

const DISMISSED_KEY = "fitcheck.installDismissed";
const DELAY_MS = 20000;

export function InstallPrompt() {
  const [visible, setVisible] = useState(false);
  const { canInstall, ios, promptAvailable, install } = useInstallPrompt();

  useEffect(() => {
    if (isNative()) return;
    if (localStorage.getItem(DISMISSED_KEY)) return;
    if (!canInstall) return;

    if (promptAvailable || ios) {
      const t = setTimeout(() => setVisible(true), DELAY_MS);
      return () => clearTimeout(t);
    }
  }, [canInstall, promptAvailable, ios]);

  const handleInstall = async () => {
    await install();
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

          {ios ? (
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
