import { Recommendation } from "@/lib/recommend";
import { OutfitCard } from "./OutfitCard";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { ChevronDown, Sun, Sunset, Moon } from "lucide-react";
import { cn } from "@/lib/utils";

// src/components/TimeOfDayTabs.tsx
// Displays expandable rich cards for Morning, Afternoon, and Evening recommendations.

interface TimeOfDayTabsProps {
  morning: Recommendation;
  afternoon: Recommendation;
  evening: Recommendation;
}

export function TimeOfDayTabs({ morning, afternoon, evening }: TimeOfDayTabsProps) {
  const [expanded, setExpanded] = useState<string>("afternoon");

  const periods = [
    { id: "morning", label: "Morning", icon: Sun, data: morning },
    { id: "afternoon", label: "Afternoon", icon: Sunset, data: afternoon },
    { id: "evening", label: "Evening", icon: Moon, data: evening }
  ];

  return (
    <div className="space-y-3 mt-4">
      {periods.map((period) => {
        const isExpanded = expanded === period.id;
        const Icon = period.icon;

        return (
          <motion.div 
            layout
            key={period.id} 
            className={cn(
              "border bg-card rounded-3xl shadow-sm overflow-hidden transition-colors",
              isExpanded ? "border-primary/30 ring-1 ring-primary/10" : ""
            )}
          >
            <button 
              onClick={() => setExpanded(isExpanded ? "" : period.id)}
              className="w-full px-5 py-4 flex items-center justify-between text-left outline-none"
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "p-2 rounded-xl transition-colors",
                  isExpanded ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                )}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base">{period.label}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-1 pr-4">
                    {period.data.mainOutfit}
                  </p>
                </div>
              </div>
              <motion.div
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                className="shrink-0 text-muted-foreground"
              >
                <ChevronDown className="w-5 h-5" />
              </motion.div>
            </button>

            <AnimatePresence>
              {isExpanded && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 pt-0 border-t border-border/50 bg-muted/20">
                    <OutfitCard recommendation={period.data} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}
