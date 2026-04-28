import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X } from "lucide-react";
import { APP_VERSION } from "@/lib/version";

const STORAGE_KEY = "fitcheck.appVersion";

export function UpdateBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem(STORAGE_KEY);
    if (seen !== APP_VERSION) {
      if (seen !== null) {
        setVisible(true);
      }
      localStorage.setItem(STORAGE_KEY, APP_VERSION);
    }
  }, []);

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleDismiss = () => {
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -40 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
          className="absolute top-0 left-0 right-0 z-[60] flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground text-sm font-semibold shadow-lg"
        >
          <Sparkles className="w-4 h-4 shrink-0" />
          <span className="flex-1">FIT✔️ just got better!</span>
          <button
            onClick={handleRefresh}
            className="underline underline-offset-2 text-primary-foreground/90 hover:text-primary-foreground shrink-0"
          >
            Refresh
          </button>
          <button onClick={handleDismiss} className="ml-1 opacity-70 hover:opacity-100">
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
