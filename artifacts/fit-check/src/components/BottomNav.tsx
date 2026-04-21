import { Link, useLocation } from "wouter";
import { Home, Cloud, Sparkles, Shirt, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { path: "/", label: "Home", icon: Home },
  { path: "/forecast", label: "Forecast", icon: Cloud },
  { path: "/style", label: "Style", icon: Sparkles },
  { path: "/closet", label: "Closet", icon: Shirt },
  { path: "/settings", label: "Settings", icon: Settings },
];

export function BottomNav() {
  const [location] = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-t border-border sm:max-w-[480px] sm:mx-auto pb-safe">
      <div className="flex items-center justify-around p-3">
        {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
          const isActive = location === path;
          return (
            <Link key={path} href={path} className={cn(
              "flex flex-col items-center justify-center w-full space-y-1 transition-colors",
              isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}>
              <Icon className="w-6 h-6" strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
