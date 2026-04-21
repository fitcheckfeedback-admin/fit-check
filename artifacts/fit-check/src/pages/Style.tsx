import { useFitCheckSettings } from "@/hooks/useFitCheckSettings";
import { StylePreference } from "@/lib/storage";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const STYLES: { id: StylePreference; label: string; desc: string }[] = [
  { id: "Casual", label: "Casual", desc: "Comfortable, everyday basics." },
  { id: "Streetwear", label: "Streetwear", desc: "Bold, trendy, and relaxed fits." },
  { id: "Athletic", label: "Athletic", desc: "Sporty, performance-driven gear." },
  { id: "Workwear", label: "Workwear", desc: "Durable, functional, rugged." },
  { id: "Minimal", label: "Minimal", desc: "Clean lines, neutral colors, simple." },
];

export default function Style() {
  const { settings, updateSettings } = useFitCheckSettings();

  return (
    <div className="p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Your Vibe</h1>
        <p className="text-muted-foreground">Select a style to tailor your outfit recommendations.</p>
      </div>

      <div className="grid gap-3">
        {STYLES.map((style) => {
          const isActive = settings.style === style.id;
          
          return (
            <motion.button
              whileTap={{ scale: 0.98 }}
              key={style.id}
              onClick={() => updateSettings({ style: style.id })}
              className={cn(
                "flex items-center justify-between p-5 rounded-2xl border-2 transition-all text-left",
                isActive 
                  ? "border-primary bg-primary/5 shadow-sm" 
                  : "border-transparent bg-card hover:border-primary/20 shadow-sm"
              )}
            >
              <div>
                <h3 className={cn("text-lg font-bold", isActive ? "text-primary" : "text-foreground")}>
                  {style.label}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">{style.desc}</p>
              </div>
              
              <div className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center shrink-0 ml-4 transition-colors",
                isActive ? "bg-primary text-primary-foreground" : "bg-muted text-transparent"
              )}>
                <Check className="w-4 h-4" strokeWidth={3} />
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
