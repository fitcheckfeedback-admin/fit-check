import { Link, useLocation } from "wouter";
import { Home, Shirt, Settings, ShoppingBag, CloudSun } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const NAV_ITEMS = [
  { path: "/", label: "Home", icon: Home, pro: false },
  { path: "/discover", label: "Shop", icon: ShoppingBag, pro: true },
  { path: "/forecast", label: "Forecast", icon: CloudSun, pro: false },
  { path: "/closet", label: "Closet", icon: Shirt, pro: false },
  { path: "/settings", label: "Settings", icon: Settings, pro: false },
];

export function BottomNav() {
  const [location] = useLocation();

  return (
    <div className="sticky bottom-0 z-50 flex justify-center pb-6 pt-2 px-4 pointer-events-none">
      <nav className="pointer-events-auto w-full max-w-sm bg-background/90 backdrop-blur-md border border-border/50 rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.12)] px-2 py-2">
        <div className="flex items-center justify-around">
          {NAV_ITEMS.map(({ path, label, icon: Icon, pro }) => {
            const isActive = location === path;
            return (
              <Link
                key={path}
                href={path}
                className="flex flex-col items-center justify-center gap-0.5 flex-1 py-1 outline-none"
              >
                <motion.div
                  whileTap={{ scale: 0.85 }}
                  className="flex flex-col items-center gap-0.5"
                >
                  <div className="relative">
                    <Icon
                      className={cn(
                        "w-6 h-6 transition-colors duration-200",
                        isActive ? "text-primary" : "text-muted-foreground"
                      )}
                      strokeWidth={isActive ? 2.5 : 1.75}
                    />
                    {pro && (
                      <span className="absolute -top-1 -right-1.5 text-[8px] font-black bg-amber-500 text-black px-1 rounded-full leading-tight">
                        PRO
                      </span>
                    )}
                  </div>
                  <span
                    className={cn(
                      "text-[10px] transition-colors duration-200",
                      isActive ? "text-primary font-semibold" : "text-muted-foreground font-normal"
                    )}
                  >
                    {label}
                  </span>
                </motion.div>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
