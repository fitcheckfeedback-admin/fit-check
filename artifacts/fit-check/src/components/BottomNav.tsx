import { Link, useLocation } from "wouter";
import { Home, Cloud, Sparkles, Shirt, Settings, Video } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

// src/components/BottomNav.tsx
// Refined iOS-style bottom tab bar

const NAV_ITEMS = [
  { path: "/", label: "Home", icon: Home, cam: false },
  { path: "/forecast", label: "Forecast", icon: Cloud, cam: false },
  { path: "/cam", label: "GRWM", icon: Video, cam: true },
  { path: "/closet", label: "Closet", icon: Shirt, cam: false },
  { path: "/settings", label: "Settings", icon: Settings, cam: false },
];

export function BottomNav() {
  const [location] = useLocation();

  return (
    <nav className="sticky bottom-0 z-50 pb-safe pointer-events-none">
      <div className="bg-background/85 dark:bg-slate-900/85 backdrop-blur-xl border-t border-border shadow-[0_-4px_24px_rgba(0,0,0,0.05)] px-2 pt-2 pb-6 pointer-events-auto">
        <div className="flex items-center justify-around">
          {NAV_ITEMS.map(({ path, label, icon: Icon, cam }) => {
            const isActive = location === path;
            if (cam) {
              return (
                <Link key={path} href={path} className="relative flex flex-col items-center justify-center w-full pb-1 group outline-none -mt-3">
                  <motion.div whileTap={{ scale: 0.88 }} className="flex flex-col items-center">
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-all",
                      isActive
                        ? "bg-primary shadow-primary/40"
                        : "bg-gradient-to-br from-[#FF9500] to-[#FF6B00] shadow-[#FF9500]/30"
                    )}>
                      <Icon className="w-6 h-6 text-white" strokeWidth={2} />
                    </div>
                    <span className={cn(
                      "text-[10px] font-medium mt-1 transition-colors duration-300",
                      isActive ? "text-primary font-bold" : "text-muted-foreground"
                    )}>{label}</span>
                  </motion.div>
                </Link>
              );
            }
            return (
              <Link key={path} href={path} className="relative flex flex-col items-center justify-center w-full pt-2 pb-1 group outline-none">
                {isActive && (
                  <motion.div 
                    layoutId="bottom-nav-bg"
                    className="absolute inset-y-1 inset-x-3 bg-primary/15 rounded-2xl -z-10"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <motion.div 
                  whileTap={{ scale: 0.9 }}
                  className="flex flex-col items-center z-10"
                >
                  <Icon 
                    className={cn(
                      "w-6 h-6 transition-colors duration-300 drop-shadow-sm",
                      isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                    )} 
                    strokeWidth={isActive ? 2.5 : 2} 
                  />
                  <span className={cn(
                    "text-[10px] font-medium mt-1 transition-colors duration-300",
                    isActive ? "text-primary font-bold" : "text-muted-foreground"
                  )}>{label}</span>
                </motion.div>
                {isActive && (
                  <motion.div 
                    layoutId="bottom-nav-indicator"
                    className="absolute -top-2 w-12 h-1 bg-primary rounded-b-full shadow-[0_0_8px_hsl(var(--primary)/0.6)]"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
