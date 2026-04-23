import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const SEEN_KEY = "fitcheck.tour.v1";

const SLIDES = [
  {
    emoji: "🌤️",
    title: "Your daily fit, sorted",
    body: "Every day Fit Check reads your local weather and suggests exactly what to wear — no more standing at your wardrobe guessing.",
  },
  {
    emoji: "👗",
    title: "Tap the outfit card",
    body: "Tap the outfit suggestion on the home screen to see full details, share your look on social, or save it as a favourite.",
  },
  {
    emoji: "👔",
    title: "Build your closet",
    body: "Head to the Closet tab and add your actual clothes. Fit Check will suggest outfits using what you already own.",
  },
  {
    emoji: "🔔",
    title: "Never forget your fit",
    body: "Set a morning reminder so your personalised outfit is ready before you even get out of bed.",
  },
  {
    emoji: "✨",
    title: "You're all set!",
    body: "Explore the app and let the weather decide your style. New features drop regularly — enjoy the beta!",
  },
];

export function AppTour() {
  const [visible, setVisible] = useState(false);
  const [slide, setSlide] = useState(0);
  const [direction, setDirection] = useState(1);

  useEffect(() => {
    if (!localStorage.getItem(SEEN_KEY)) {
      // Short delay so the home screen renders first
      const t = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(t);
    }
  }, []);

  const dismiss = () => {
    localStorage.setItem(SEEN_KEY, "1");
    setVisible(false);
  };

  const next = () => {
    if (slide === SLIDES.length - 1) {
      dismiss();
      return;
    }
    setDirection(1);
    setSlide(s => s + 1);
  };

  const goTo = (i: number) => {
    setDirection(i > slide ? 1 : -1);
    setSlide(i);
  };

  const isLast = slide === SLIDES.length - 1;
  const current = SLIDES[slide];

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110]"
          />

          {/* Card */}
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-x-4 bottom-8 z-[111] max-w-[440px] mx-auto"
          >
            <div className="bg-card rounded-3xl shadow-2xl border border-border/30 overflow-hidden">

              {/* Coloured top strip that changes per slide */}
              <motion.div
                key={slide}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                style={{ originX: 0 }}
                className="h-1 w-full bg-gradient-to-r from-primary to-primary/50"
              />

              <div className="p-6 pt-5">
                {/* Top row */}
                <div className="flex items-center justify-between mb-5">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                    {slide + 1} of {SLIDES.length}
                  </span>
                  <button
                    onClick={dismiss}
                    className="w-7 h-7 flex items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Slide content */}
                <AnimatePresence mode="wait" custom={direction}>
                  <motion.div
                    key={slide}
                    custom={direction}
                    initial={{ opacity: 0, x: direction * 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: direction * -40 }}
                    transition={{ duration: 0.22, ease: "easeOut" }}
                    className="mb-6"
                  >
                    <div className="text-5xl mb-4">{current.emoji}</div>
                    <h2 className="text-xl font-display font-bold mb-2 leading-tight">{current.title}</h2>
                    <p className="text-sm text-muted-foreground leading-relaxed">{current.body}</p>
                  </motion.div>
                </AnimatePresence>

                {/* Progress dots */}
                <div className="flex items-center gap-1.5 mb-5">
                  {SLIDES.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => goTo(i)}
                      className={`rounded-full transition-all duration-300 ${
                        i === slide
                          ? "w-6 h-2 bg-primary"
                          : "w-2 h-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                      }`}
                    />
                  ))}
                </div>

                {/* Actions */}
                <Button
                  onClick={next}
                  className="w-full h-12 font-bold rounded-2xl text-sm"
                >
                  {isLast ? "Start using Fit Check" : (
                    <span className="flex items-center gap-1.5">
                      Next <ChevronRight className="w-4 h-4" />
                    </span>
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
