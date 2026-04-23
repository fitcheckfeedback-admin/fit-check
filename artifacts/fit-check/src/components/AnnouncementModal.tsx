import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Rocket, Share2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const SEEN_KEY = "fitcheck.announcement.v1";

interface AnnouncementModalProps {
  appUrl?: string;
}

export function AnnouncementModal({ appUrl = "https://style-sense-fitcheck.replit.app" }: AnnouncementModalProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(SEEN_KEY)) {
      setVisible(true);
    }
  }, []);

  const dismiss = () => {
    localStorage.setItem(SEEN_KEY, "1");
    setVisible(false);
  };

  const share = async () => {
    const text = "Check out Fit Check — it tells you what to wear based on today's weather!";
    if (navigator.share) {
      try {
        await navigator.share({ title: "Fit Check", text, url: appUrl });
      } catch {}
    } else {
      try {
        await navigator.clipboard.writeText(`${text}\n${appUrl}`);
        alert("Link copied to clipboard!");
      } catch {}
    }
    dismiss();
  };

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]"
            onClick={dismiss}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="fixed inset-x-4 bottom-0 pb-10 z-[101] flex flex-col pointer-events-none"
            style={{ maxWidth: 480, margin: "0 auto" }}
          >
            <div className="bg-card rounded-3xl shadow-2xl border border-border/40 overflow-hidden pointer-events-auto">

              {/* Header gradient strip */}
              <div className="relative h-2 w-full bg-gradient-to-r from-[#FF9500] via-[#FF6B00] to-[#FF4500]" />

              <div className="p-6">
                {/* Dismiss button */}
                <button
                  onClick={dismiss}
                  className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Icon + heading */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FF9500] to-[#FF4500] flex items-center justify-center shadow-md shrink-0">
                    <Rocket className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary/70 mb-0.5">Beta Update</p>
                    <h2 className="text-lg font-display font-bold leading-tight">We're going full app!</h2>
                  </div>
                </div>

                {/* Body */}
                <p className="text-sm text-muted-foreground leading-relaxed mb-5">
                  Fit Check is growing up — we're building toward a full native app launch. Before we get there, we need more real users testing it out.{" "}
                  <span className="font-semibold text-foreground">If you're enjoying it, sharing it with one friend makes a huge difference.</span>
                </p>

                {/* Actions */}
                <div className="flex flex-col gap-2.5">
                  <Button
                    onClick={share}
                    className="w-full h-11 font-bold rounded-2xl text-sm"
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Share with a Friend
                  </Button>
                  <button
                    onClick={dismiss}
                    className="w-full h-9 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Maybe later
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
