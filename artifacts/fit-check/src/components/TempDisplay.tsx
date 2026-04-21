import { formatTemp } from "@/lib/format";
import { motion, AnimatePresence } from "framer-motion";

// src/components/TempDisplay.tsx
// Animated temperature display with sliding numbers.

interface TempDisplayProps {
  tempF: number;
  units: "f" | "c";
}

export function TempDisplay({ tempF, units }: TempDisplayProps) {
  const formatted = formatTemp(tempF, units);
  
  // Extract just the number and the symbol
  const tempStr = formatted.replace(/°[FC]/, '');
  const symbol = formatted.match(/°[FC]/)?.[0] || '°';

  return (
    <div className="flex items-start text-7xl font-display font-bold tracking-tighter text-foreground drop-shadow-sm">
      <div className="flex overflow-hidden">
        <AnimatePresence mode="popLayout">
          <motion.span
            key={tempStr}
            initial={{ y: "50%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "-50%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="inline-block"
          >
            {tempStr}
          </motion.span>
        </AnimatePresence>
      </div>
      <span className="text-4xl mt-2 ml-1 text-foreground/80 font-sans tracking-normal">{symbol}</span>
    </div>
  );
}
