import { useFitCheckSettings } from "@/hooks/useFitCheckSettings";
import { StylePreference } from "@/lib/storage";
import { motion } from "framer-motion";
import { Check, Coffee, Zap, Dumbbell, Hammer, Hexagon } from "lucide-react";
import { cn } from "@/lib/utils";

const STYLES: { id: StylePreference; label: string; desc: string; icon: any; gradient: string; example: string }[] = [
  { 
    id: "Casual", 
    label: "Casual", 
    desc: "Comfortable, everyday basics.",
    icon: Coffee,
    gradient: "from-blue-500/10 to-cyan-500/10 border-blue-500/20",
    example: "Basic tee, favorite jeans, comfortable sneakers."
  },
  { 
    id: "Streetwear", 
    label: "Streetwear", 
    desc: "Bold, trendy, and relaxed fits.",
    icon: Zap,
    gradient: "from-purple-500/10 to-pink-500/10 border-purple-500/20",
    example: "Graphic hoodie, baggy cargos, statement kicks."
  },
  { 
    id: "Athletic", 
    label: "Athletic", 
    desc: "Sporty, performance-driven gear.",
    icon: Dumbbell,
    gradient: "from-green-500/10 to-emerald-500/10 border-green-500/20",
    example: "Tech quarter-zip, running joggers, trainers."
  },
  { 
    id: "Workwear", 
    label: "Workwear", 
    desc: "Durable, functional, rugged.",
    icon: Hammer,
    gradient: "from-amber-500/10 to-orange-500/10 border-amber-500/20",
    example: "Canvas chore coat, flannel, tough denim."
  },
  { 
    id: "Minimal", 
    label: "Minimal", 
    desc: "Clean lines, neutral colors, simple.",
    icon: Hexagon,
    gradient: "from-slate-500/10 to-zinc-500/10 border-slate-500/20",
    example: "Monochrome knit, tailored trousers, clean shoes."
  },
];

export default function Style() {
  const { settings, updateSettings } = useFitCheckSettings();

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-6 space-y-8 pb-12"
    >
      <div>
        <h1 className="text-4xl font-display font-bold mb-2">Your Vibe</h1>
        <p className="text-muted-foreground font-medium">Select a style to tailor your outfit recommendations.</p>
      </div>

      <div className="grid gap-4">
        {STYLES.map((style, i) => {
          const isActive = settings.style === style.id;
          const Icon = style.icon;
          
          return (
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileTap={{ scale: 0.97 }}
              key={style.id}
              onClick={() => updateSettings({ style: style.id })}
              className={cn(
                "relative overflow-hidden flex flex-col p-6 rounded-[2rem] border-2 transition-all text-left group",
                isActive 
                  ? "border-primary bg-primary/5 shadow-md" 
                  : `bg-card hover:border-primary/30 shadow-sm hover:shadow-md ${style.gradient}`
              )}
            >
              {/* Background gradient hint */}
              <div className={cn(
                "absolute inset-0 bg-gradient-to-br opacity-50 transition-opacity",
                style.gradient,
                isActive ? "opacity-100" : "group-hover:opacity-80"
              )} />

              <div className="relative z-10 flex items-start justify-between w-full">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "p-3 rounded-2xl transition-colors",
                    isActive ? "bg-primary text-primary-foreground" : "bg-background text-foreground shadow-sm"
                  )}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className={cn("text-2xl font-display font-bold", isActive ? "text-primary" : "text-foreground")}>
                      {style.label}
                    </h3>
                    <p className="text-sm font-medium text-muted-foreground mt-0.5">{style.desc}</p>
                  </div>
                </div>
                
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all transform",
                  isActive ? "bg-primary text-primary-foreground scale-100" : "bg-muted text-transparent scale-50 opacity-0 group-hover:opacity-50"
                )}>
                  <Check className="w-5 h-5" strokeWidth={3} />
                </div>
              </div>

              <div className="relative z-10 mt-5 pt-4 border-t border-border/40">
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground/80">Example:</span> {style.example}
                </p>
              </div>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}
