import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { Sun, CloudRain, Wind, Snowflake, Star, Check, ArrowRight, Thermometer, Sparkles, ShoppingBag } from "lucide-react";
import { useState, useEffect, useCallback } from "react";

const queryClient = new QueryClient();

const APP_URL = "/";

function getLandingVisitorId(): string {
  const key = "fitcheck.landing.visitorId";
  let id = localStorage.getItem(key);
  if (!id) {
    id = "lv_" + crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

function useLandingTracker() {
  const track = useCallback((eventType: string) => {
    const deviceId = getLandingVisitorId();
    fetch("/api/analytics/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deviceId, eventType, metadata: { source: "landing" } }),
    }).catch(() => {});
  }, []);

  useEffect(() => {
    track("landing_page_view");
  }, [track]);

  return track;
}

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

const WEATHERS = [
  {
    icon: Sun,
    label: "Sunny · 78°F",
    color: "text-amber-400",
    bg: "bg-amber-400/10",
    outfit: ["Linen shirt", "Slim chinos", "White sneakers"],
    vibe: "The Weekend Look",
    gradient: "from-amber-500/20 via-orange-400/10 to-transparent",
  },
  {
    icon: CloudRain,
    label: "Rainy · 55°F",
    color: "text-blue-400",
    bg: "bg-blue-400/10",
    outfit: ["Trench coat", "Dark jeans", "Chelsea boots"],
    vibe: "Rainy Day Chic",
    gradient: "from-blue-500/20 via-indigo-400/10 to-transparent",
  },
  {
    icon: Wind,
    label: "Windy · 62°F",
    color: "text-teal-400",
    bg: "bg-teal-400/10",
    outfit: ["Zip hoodie", "Cargo pants", "Low-top trainers"],
    vibe: "Street Ready",
    gradient: "from-teal-500/20 via-cyan-400/10 to-transparent",
  },
  {
    icon: Snowflake,
    label: "Cold · 28°F",
    color: "text-sky-300",
    bg: "bg-sky-300/10",
    outfit: ["Puffer coat", "Thermal layer", "Boots + scarf"],
    vibe: "Winter Edit",
    gradient: "from-sky-500/20 via-blue-300/10 to-transparent",
  },
];

function OutfitCard() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIndex(i => (i + 1) % WEATHERS.length), 3000);
    return () => clearInterval(t);
  }, []);

  const w = WEATHERS[index];
  const Icon = w.icon;

  return (
    <div className="relative w-full max-w-[320px] mx-auto select-none">
      <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-[#FF9500]/20 to-transparent blur-2xl scale-110" />
      <div className="relative rounded-[2rem] bg-zinc-900 border border-white/10 p-6 shadow-2xl overflow-hidden">
        <div className={`absolute inset-0 bg-gradient-to-br ${w.gradient} transition-all duration-700`} />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-5">
            <div className={`flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full border border-white/10 ${w.bg} ${w.color}`}>
              <Icon className="w-3.5 h-3.5" />
              <AnimatePresence mode="wait">
                <motion.span
                  key={w.label}
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={{ duration: 0.3 }}
                >
                  {w.label}
                </motion.span>
              </AnimatePresence>
            </div>
            <img src="/logo.png" alt="FIT✔️" className="w-8 h-8 rounded-xl" />
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              <p className="text-[10px] uppercase tracking-[0.15em] text-white/40 font-bold mb-1">Today's Fit</p>
              <p className="text-xl font-black text-white mb-4">{w.vibe}</p>
              <div className="space-y-2">
                {w.outfit.map((item, i) => (
                  <motion.div
                    key={item}
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="flex items-center gap-2.5"
                  >
                    <div className="w-5 h-5 rounded-full bg-[#FF9500]/20 flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 text-[#FF9500]" />
                    </div>
                    <span className="text-sm text-white/80 font-medium">{item}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="mt-5 pt-4 border-t border-white/8 flex gap-1.5">
            {WEATHERS.map((_, i) => (
              <div
                key={i}
                className={`h-1 rounded-full transition-all duration-500 ${i === index ? "bg-[#FF9500] flex-1" : "bg-white/20 w-4"}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Home() {
  const { scrollY } = useScroll();
  const navBg = useTransform(scrollY, [0, 80], ["rgba(0,0,0,0)", "rgba(10,10,10,0.95)"]);
  const track = useLandingTracker();
  const [showStickyBar, setShowStickyBar] = useState(false);

  useEffect(() => {
    const unsub = scrollY.on("change", (y) => {
      setShowStickyBar(y > 420);
    });
    return unsub;
  }, [scrollY]);

  return (
    <div className="min-h-screen w-full bg-[#0A0A0A] text-white overflow-x-hidden" style={{ fontFamily: "'Outfit', sans-serif" }}>

      {/* NAV */}
      <motion.nav
        style={{ backgroundColor: navBg }}
        className="fixed top-0 left-0 right-0 z-50 px-5 py-4 flex items-center justify-between backdrop-blur-sm border-b border-white/5"
      >
        <div className="flex items-center gap-2.5">
          <img src="/logo.png" alt="FIT✔️" className="w-9 h-9 rounded-xl shadow" />
          <span className="font-black text-lg tracking-tight">FIT<span className="text-[#FF9500]">✔</span></span>
        </div>
        <span className="text-xs text-white/40 font-semibold">Free · No download</span>
      </motion.nav>

      {/* HERO */}
      <section className="min-h-screen flex flex-col items-center justify-center pt-24 pb-16 px-5 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#FF9500]/12 rounded-full blur-[100px] pointer-events-none" />

        <motion.div
          className="w-full max-w-lg mx-auto flex flex-col items-center text-center"
          variants={stagger}
          initial="hidden"
          animate="visible"
        >
          {/* No download badge */}
          <motion.div variants={fadeUp} className="flex items-center gap-2 mb-6">
            <span className="bg-white/8 border border-white/12 text-white/70 text-xs font-bold px-4 py-1.5 rounded-full tracking-wide">
              🌐 Works in your browser — no download needed
            </span>
          </motion.div>

          {/* Hook headline — above the fold */}
          <motion.h1
            variants={fadeUp}
            className="text-5xl sm:text-6xl font-black leading-[1.05] tracking-tight mb-5"
          >
            You own 40 outfits.<br />
            <span className="text-[#FF9500]">You wear the same 5.</span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="text-xl text-white/70 font-semibold leading-snug mb-2 max-w-xs"
          >
            We pick your outfit based on today's weather.
          </motion.p>

          <motion.p
            variants={fadeUp}
            className="text-sm text-white/35 font-medium mb-10"
          >
            Takes 3 seconds. No guesswork.
          </motion.p>

          {/* Social proof */}
          <motion.div variants={fadeUp} className="flex flex-col items-center gap-2 mb-6">
            <div className="flex items-center gap-2">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-[#FF9500] text-[#FF9500]" />
                ))}
              </div>
              <span className="text-white/60 text-sm font-semibold">Loved by early users</span>
            </div>
            <span className="text-xs font-bold text-[#FF9500]/80">🔥 500+ outfits picked this week</span>
          </motion.div>

          {/* Primary CTA — before the card */}
          <motion.div variants={fadeUp} className="w-full max-w-xs mb-3 relative">
            <div className="absolute inset-0 rounded-2xl bg-[#FF9500]/40 blur-xl animate-pulse" />
            <a
              href={APP_URL}
              onClick={() => track("landing_cta_click")}
              className="relative w-full flex items-center justify-center gap-2 bg-[#FF9500] text-black font-black text-lg px-8 py-5 rounded-2xl shadow-xl shadow-[#FF9500]/40 hover:bg-orange-400 active:scale-95 transition-all"
            >
              See Today's Outfit <ArrowRight className="w-5 h-5" />
            </a>
          </motion.div>

          <motion.p variants={fadeUp} className="text-sm text-white/45 font-semibold mb-14 tracking-wide">
            Free forever &nbsp;·&nbsp; No sign-up needed &nbsp;·&nbsp; Works instantly
          </motion.p>

          {/* Visual proof — outfit card after CTA */}
          <motion.div variants={fadeUp} className="w-full">
            <a href={APP_URL} onClick={() => track("landing_card_click")} className="block">
              <OutfitCard />
              <p className="text-center text-white/35 text-xs font-semibold mt-3 tracking-wide">
                👆 Tap the card to see your real outfit
              </p>
            </a>
          </motion.div>
        </motion.div>
      </section>

      {/* PROBLEM */}
      <section className="py-20 px-5 bg-zinc-950">
        <motion.div
          className="max-w-lg mx-auto text-center"
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
        >
          <motion.p variants={fadeUp} className="text-[#FF9500] text-xs font-black uppercase tracking-widest mb-4">Every morning</motion.p>
          <motion.h2 variants={fadeUp} className="text-3xl font-black leading-tight mb-6">
            The same 10-minute<br />struggle. Every. Day.
          </motion.h2>
          <motion.p variants={fadeUp} className="text-white/50 text-base leading-relaxed">
            Check the weather. Stare at the closet. Second-guess everything. Leave in a rush wearing whatever's on top.
          </motion.p>
          <motion.p variants={fadeUp} className="text-white/80 font-bold text-lg mt-6">
            FIT✔️ ends that in 3 seconds.
          </motion.p>
        </motion.div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-20 px-5">
        <div className="max-w-lg mx-auto">
          <motion.div
            className="text-center mb-12"
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <motion.p variants={fadeUp} className="text-[#FF9500] text-xs font-black uppercase tracking-widest mb-3">How it works</motion.p>
            <motion.h2 variants={fadeUp} className="text-3xl font-black">Simple as opening an app.</motion.h2>
          </motion.div>

          <div className="space-y-4">
            {[
              {
                num: "01",
                icon: Thermometer,
                title: "Live weather, automatically",
                desc: "Opens to your exact local conditions — temperature, rain, wind, all of it. No searching or typing.",
              },
              {
                num: "02",
                icon: Sparkles,
                title: "AI picks your outfit",
                desc: "Our stylist cross-references the weather with your taste and closet. One tap, full look.",
              },
              {
                num: "03",
                icon: ShoppingBag,
                title: "Walk out the door confident",
                desc: "Save your fits, plan ahead for the week, or share your look. Looking good has never been this easy.",
              },
            ].map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="flex gap-5 items-start p-6 rounded-2xl bg-zinc-900 border border-white/6"
              >
                <div className="shrink-0 w-12 h-12 rounded-xl bg-[#FF9500]/10 border border-[#FF9500]/20 flex items-center justify-center">
                  <step.icon className="w-5 h-5 text-[#FF9500]" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-white/25 uppercase tracking-widest mb-1">{step.num}</p>
                  <h3 className="font-black text-base mb-1.5">{step.title}</h3>
                  <p className="text-sm text-white/45 leading-relaxed">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES GRID */}
      <section className="py-20 px-5 bg-zinc-950">
        <div className="max-w-lg mx-auto">
          <motion.div
            className="text-center mb-12"
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <motion.p variants={fadeUp} className="text-[#FF9500] text-xs font-black uppercase tracking-widest mb-3">Features</motion.p>
            <motion.h2 variants={fadeUp} className="text-3xl font-black">Everything you need.</motion.h2>
          </motion.div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: "🌤️", title: "Real-time weather", desc: "Live conditions for your exact location" },
              { icon: "✨", title: "AI outfit picks", desc: "Styled suggestions tailored to your taste" },
              { icon: "👗", title: "Your closet", desc: "Add your clothes, get personalized looks" },
              { icon: "📅", title: "Week forecast", desc: "Plan outfits for the whole week ahead" },
              { icon: "🔔", title: "Morning alerts", desc: "Get your outfit before you leave bed" },
              { icon: "🗓️", title: "Trip planner", desc: "Pack perfectly for any trip or weather" },
            ].map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.92 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                className="p-5 rounded-2xl bg-zinc-900 border border-white/6"
              >
                <span className="text-2xl mb-3 block">{f.icon}</span>
                <h3 className="font-black text-sm mb-1">{f.title}</h3>
                <p className="text-xs text-white/40 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-20 px-5">
        <div className="max-w-lg mx-auto">
          <motion.div
            className="text-center mb-12"
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <motion.p variants={fadeUp} className="text-[#FF9500] text-xs font-black uppercase tracking-widest mb-3">Early users</motion.p>
            <motion.h2 variants={fadeUp} className="text-3xl font-black">People are loving it.</motion.h2>
          </motion.div>

          <div className="space-y-4">
            {[
              {
                text: "I used to spend 15 minutes every morning deciding what to wear. Now I just open FIT✔️ and I'm done in seconds. Actually wearing stuff I forgot I owned.",
                name: "Sarah K.",
                handle: "Marketing Director",
                stars: 5,
              },
              {
                text: "The weather integration is insane. It knew it was going to be windy before I did and suggested a jacket. Hasn't been wrong once.",
                name: "Marcus T.",
                handle: "Works in finance",
                stars: 5,
              },
              {
                text: "Finally an app that doesn't just tell me the weather — it tells me what to DO about it. Changed my mornings completely.",
                name: "Priya R.",
                handle: "Grad student",
                stars: 5,
              },
            ].map((r, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-6 rounded-2xl bg-zinc-900 border border-white/6"
              >
                <div className="flex gap-0.5 mb-4">
                  {[...Array(r.stars)].map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-[#FF9500] text-[#FF9500]" />
                  ))}
                </div>
                <p className="text-white/80 text-sm leading-relaxed mb-5 italic">"{r.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#FF9500]/15 border border-[#FF9500]/25 flex items-center justify-center text-[#FF9500] font-black text-sm">
                    {r.name[0]}
                  </div>
                  <div>
                    <p className="font-bold text-sm">{r.name}</p>
                    <p className="text-xs text-white/35">{r.handle}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-24 px-5 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#FF9500]/8 via-[#FF9500]/5 to-transparent pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#FF9500]/12 rounded-full blur-[80px] pointer-events-none" />

        <motion.div
          className="relative z-10 max-w-lg mx-auto text-center"
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
        >
          <motion.img
            variants={fadeUp}
            src="/logo.png"
            alt="FIT✔️"
            className="w-20 h-20 rounded-[1.5rem] mx-auto mb-8 shadow-xl shadow-[#FF9500]/20"
          />
          <motion.h2 variants={fadeUp} className="text-4xl font-black leading-tight mb-5">
            Your best-dressed<br />morning starts now.
          </motion.h2>
          <motion.p variants={fadeUp} className="text-white/45 text-base leading-relaxed mb-10 max-w-xs mx-auto">
            Free to use. No account needed. Just open it, check the weather, and get dressed with confidence.
          </motion.p>

          <motion.div variants={fadeUp} className="flex flex-col items-center gap-4">
            <a
              href={APP_URL}
              onClick={() => track("landing_cta_click")}
              className="w-full max-w-xs flex items-center justify-center gap-2 bg-[#FF9500] text-black font-black text-lg px-8 py-5 rounded-2xl shadow-xl shadow-[#FF9500]/30 hover:bg-orange-400 active:scale-95 transition-all"
            >
              Get My Daily FIT✔️ <ArrowRight className="w-5 h-5" />
            </a>

            <div className="flex items-center gap-6 pt-2">
              {[["Free", "Always"], ["Instant", "No signup"], ["Daily", "Outfits"]].map(([top, bot]) => (
                <div key={top} className="text-center">
                  <p className="text-[#FF9500] font-black text-sm">{top}</p>
                  <p className="text-white/35 text-xs">{bot}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* STICKY BOTTOM CTA */}
      <AnimatePresence>
        {showStickyBar && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-6 pt-3 bg-gradient-to-t from-black/95 to-transparent"
          >
            <a
              href={APP_URL}
              onClick={() => track("landing_sticky_cta_click")}
              className="flex items-center justify-center gap-2 w-full max-w-sm mx-auto bg-[#FF9500] text-black font-black text-base px-6 py-4 rounded-2xl shadow-2xl shadow-[#FF9500]/30 active:scale-95 transition-all"
            >
              See Today's Outfit <ArrowRight className="w-5 h-5" />
            </a>
            <p className="text-center text-white/30 text-xs mt-2 font-medium">Free · No sign-up · Works right now</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FOOTER */}
      <footer className="border-t border-white/6 py-10 px-5">
        <div className="max-w-lg mx-auto flex flex-col items-center gap-4">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="FIT✔️" className="w-7 h-7 rounded-lg opacity-60" />
            <span className="font-black text-white/40">FIT✔️</span>
          </div>
          <p className="text-xs text-white/25 text-center">
            © {new Date().getFullYear()} FIT✔️ · Look good. Feel confident. Be you.
          </p>
        </div>
      </footer>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
