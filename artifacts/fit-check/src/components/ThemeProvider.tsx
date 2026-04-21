import { useEffect } from "react";
import { useFitCheckSettings } from "@/hooks/useFitCheckSettings";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { settings } = useFitCheckSettings();

  useEffect(() => {
    const root = window.document.documentElement;
    
    root.classList.remove("light", "dark");

    if (settings.theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
      root.classList.add(systemTheme);
      return;
    }

    root.classList.add(settings.theme);
  }, [settings.theme]);

  return <>{children}</>;
}
