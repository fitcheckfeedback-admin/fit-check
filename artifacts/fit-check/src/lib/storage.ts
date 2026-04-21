// src/lib/storage.ts

export type StylePreference = "Casual" | "Streetwear" | "Athletic" | "Workwear" | "Minimal";
export type ThemePreference = "light" | "dark" | "system";

export interface LocationData {
  name: string;
  lat: number;
  lon: number;
}

export interface ClosetData {
  tops: string[];
  bottoms: string[];
  outerwear: string[];
  shoes: string[];
}

export interface FitCheckSettings {
  onboarded: boolean;
  location: LocationData | null;
  units: "f" | "c";
  style: StylePreference;
  closet: ClosetData;
  theme: ThemePreference;
}

const DEFAULT_SETTINGS: FitCheckSettings = {
  onboarded: false,
  location: null,
  units: "f",
  style: "Casual",
  closet: {
    tops: [],
    bottoms: [],
    outerwear: [],
    shoes: []
  },
  theme: "system"
};

export function getSettings(): FitCheckSettings {
  try {
    const onboarded = localStorage.getItem("fitcheck.onboarded") === "true";
    const locRaw = localStorage.getItem("fitcheck.location");
    const location = locRaw ? JSON.parse(locRaw) : null;
    const units = (localStorage.getItem("fitcheck.units") as "f" | "c") || "f";
    const style = (localStorage.getItem("fitcheck.style") as StylePreference) || "Casual";
    const closetRaw = localStorage.getItem("fitcheck.closet");
    const closet = closetRaw ? JSON.parse(closetRaw) : DEFAULT_SETTINGS.closet;
    const theme = (localStorage.getItem("fitcheck.theme") as ThemePreference) || "system";

    return { onboarded, location, units, style, closet, theme };
  } catch (e) {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: Partial<FitCheckSettings>) {
  if (settings.onboarded !== undefined) localStorage.setItem("fitcheck.onboarded", String(settings.onboarded));
  if (settings.location !== undefined) localStorage.setItem("fitcheck.location", JSON.stringify(settings.location));
  if (settings.units !== undefined) localStorage.setItem("fitcheck.units", settings.units);
  if (settings.style !== undefined) localStorage.setItem("fitcheck.style", settings.style);
  if (settings.closet !== undefined) localStorage.setItem("fitcheck.closet", JSON.stringify(settings.closet));
  if (settings.theme !== undefined) localStorage.setItem("fitcheck.theme", settings.theme);
  
  // Dispatch an event so hooks can re-render
  window.dispatchEvent(new Event("fitcheck.settings.updated"));
}
