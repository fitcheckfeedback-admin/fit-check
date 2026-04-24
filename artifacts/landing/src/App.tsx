import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { motion, useScroll, useTransform } from "framer-motion";
import { ChevronRight, CloudRain, ThermometerSun, Wind, Star, Smartphone, Sparkles, ArrowRight } from "lucide-react";
import { useRef } from "react";

const queryClient = new QueryClient();

const APP_URL = "https://fit-check.replit.app";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 15 } },
};

function Home() {
  const { scrollYProgress } = useScroll();
  const yHero = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const opacityHero = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

  return (
    <div className="min-h-screen w-full bg-background text-foreground font-sans selection:bg-primary selection:text-black overflow-hidden flex flex-col">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between backdrop-blur-md bg-background/80 border-b border-border/50">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="FIT Logo" className="w-8 h-8 rounded-md" />
          <span className="font-display font-bold text-xl tracking-tight">FIT<span className="text-primary">✔️</span></span>
        </div>
        <a href={APP_URL} className="bg-primary text-black font-semibold px-4 py-2 rounded-full text-sm hover:scale-105 transition-transform active:scale-95 shadow-[0_0_20px_rgba(255,149,0,0.3)]">
          Get Started
        </a>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-6 md:pt-40 md:pb-32 flex flex-col items-center justify-center min-h-[90vh]">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[120px] opacity-50" />
        </div>
        
        <motion.div 
          className="relative z-10 w-full max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-12"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          style={{ y: yHero, opacity: opacityHero }}
        >
          <div className="flex-1 flex flex-col items-start text-left">
            <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-medium mb-6">
              <Sparkles className="w-3 h-3" />
              <span>Your AI Personal Stylist</span>
            </motion.div>
            <motion.h1 variants={itemVariants} className="text-5xl md:text-7xl font-display font-black leading-[1.1] tracking-tight mb-6">
              Never guess what to wear <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-orange-300">again.</span>
            </motion.h1>
            <motion.p variants={itemVariants} className="text-lg md:text-xl text-muted-foreground mb-8 max-w-lg leading-relaxed">
              FIT✔️ reads your local weather and suggests the perfect outfit from your closet. Look good. Feel confident. Be you.
            </motion.p>
            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <a href={APP_URL} className="flex items-center justify-center gap-2 bg-primary text-black font-bold text-lg px-8 py-4 rounded-full hover:bg-primary/90 transition-all hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(255,149,0,0.4)]">
                Try it for free <ArrowRight className="w-5 h-5" />
              </a>
            </motion.div>
          </div>

          <motion.div variants={itemVariants} className="flex-1 relative w-full max-w-md mx-auto perspective-1000">
            <div className="relative rounded-[2.5rem] border-[6px] border-secondary bg-black overflow-hidden shadow-2xl rotate-y-[-10deg] rotate-x-[5deg] transform-style-3d">
              <img src="/hero-app.png" alt="App interface" className="w-full h-auto object-cover" />
            </div>
            <div className="absolute -bottom-6 -left-6 bg-card border border-border p-4 rounded-2xl shadow-xl flex items-center gap-4 animate-bounce" style={{ animationDuration: '3s' }}>
              <div className="bg-primary/20 p-2 rounded-full text-primary">
                <ThermometerSun className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Currently</p>
                <p className="text-lg font-bold font-display">72° & Sunny</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Problem Section */}
      <section className="py-24 px-6 bg-secondary/30 relative">
        <motion.div 
          className="max-w-4xl mx-auto text-center"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={containerVariants}
        >
          <motion.h2 variants={itemVariants} className="text-3xl md:text-5xl font-display font-bold mb-6">
            The morning struggle is real.
          </motion.h2>
          <motion.p variants={itemVariants} className="text-xl text-muted-foreground">
            Staring at a closet full of clothes and having "nothing to wear." Checking three weather apps just to figure out if you need a jacket. We've all been there.
          </motion.p>
        </motion.div>
      </section>

      {/* How it works */}
      <section className="py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div 
            className="text-center mb-20"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
          >
            <motion.h2 variants={itemVariants} className="text-4xl md:text-5xl font-display font-bold mb-4">How FIT✔️ Works</motion.h2>
            <motion.p variants={itemVariants} className="text-muted-foreground text-lg max-w-2xl mx-auto">Three simple steps to a perfect morning routine.</motion.p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: "Local Weather", desc: "We pull hyper-local, real-time weather data for your exact location.", icon: CloudRain },
              { title: "AI Analysis", desc: "Our AI stylist cross-references the weather with fashion trends and your preferences.", icon: Sparkles },
              { title: "Your Outfit", desc: "Get a complete, head-to-toe outfit recommendation instantly.", icon: Smartphone }
            ].map((step, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2, type: "spring" }}
                className="bg-card border border-border p-8 rounded-3xl relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6">
                  <step.icon className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-display font-bold mb-3">{step.title}</h3>
                <p className="text-muted-foreground">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Image Section */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="rounded-[2.5rem] overflow-hidden border border-border relative aspect-[3/4]"
          >
            <img src="/closet.png" alt="Organized closet" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-8">
              <h3 className="text-3xl font-display font-bold text-white">Digitize your wardrobe.</h3>
            </div>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex flex-col gap-6"
          >
            <h2 className="text-4xl md:text-5xl font-display font-bold">Your closet,<br/>in your pocket.</h2>
            <p className="text-xl text-muted-foreground">FIT✔️ remembers what you own. It mixes and matches pieces you haven't worn in months, giving new life to your existing wardrobe.</p>
            <ul className="space-y-4 mt-4">
              {["Save 15 minutes every morning", "Discover new clothing combinations", "Never be underdressed for the weather"].map((item, i) => (
                <li key={i} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary shrink-0">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                  <span className="text-lg">{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-32 px-6 bg-secondary/50">
        <div className="max-w-6xl mx-auto">
          <motion.h2 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-display font-bold text-center mb-16"
          >
            Loved by busy people.
          </motion.h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: "Sarah J.", role: "Marketing Director", text: "This app literally changed my mornings. I no longer stare blankly at my clothes." },
              { name: "Mike T.", role: "Software Engineer", text: "Finally an app that tells me if I need a jacket. The AI suggestions are actually stylish." },
              { name: "Elena R.", role: "Student", text: "I've started wearing clothes I forgot I owned! The daily weather integration is brilliant." }
            ].map((review, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-background border border-border p-6 rounded-3xl"
              >
                <div className="flex gap-1 mb-4 text-primary">
                  {[...Array(5)].map((_, j) => <Star key={j} className="w-4 h-4 fill-current" />)}
                </div>
                <p className="text-lg mb-6 italic">"{review.text}"</p>
                <div>
                  <p className="font-bold font-display">{review.name}</p>
                  <p className="text-sm text-muted-foreground">{review.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-6 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <img src="/confident-walk.png" alt="Background" className="w-full h-full object-cover opacity-20 grayscale" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background" />
        </div>
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative z-10 max-w-3xl mx-auto text-center flex flex-col items-center"
        >
          <h2 className="text-5xl md:text-7xl font-display font-black mb-6">Stop guessing. Start dressing.</h2>
          <p className="text-xl text-muted-foreground mb-10 max-w-xl">
            Join thousands of others who start their day with FIT✔️. Free to use, ready when you wake up.
          </p>
          <a href={APP_URL} className="bg-primary text-black font-bold text-xl px-10 py-5 rounded-full hover:scale-105 transition-transform active:scale-95 shadow-[0_0_40px_rgba(255,149,0,0.5)]">
            Get Your First Outfit
          </a>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-10 px-6 text-center text-muted-foreground">
        <div className="flex items-center justify-center gap-2 mb-4 grayscale opacity-50">
          <img src="/logo.png" alt="FIT Logo" className="w-6 h-6 rounded" />
          <span className="font-display font-bold text-lg">FIT✔️</span>
        </div>
        <p className="text-sm">© {new Date().getFullYear()} FIT✔️ App. All rights reserved.</p>
        <p className="text-xs mt-2 uppercase tracking-widest font-semibold">Look good. Feel confident. Be you.</p>
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