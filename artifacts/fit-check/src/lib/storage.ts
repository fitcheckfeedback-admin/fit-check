// src/lib/storage.ts

export type Category = "tops" | "bottoms" | "outerwear" | "shoes" | "accessories";
export type StylePreference = "Casual" | "Streetwear" | "Athletic" | "Workwear" | "Minimal";
export type ThemePreference = "light" | "dark" | "system";

export const STYLE_TYPES = [
  "00s", "20s", "30s", "40s", "50s", "60s", "70s", "80s", "90s",
  "Androgynous", "Artsy", "Ballerina", "Basic", "Beach", "Biker", "Boho",
  "Business Casual", "Casual", "Comfy", "Country", "Dark / Light Academia",
  "Eclectic", "Edgy", "Elegant", "Ethereal", "Feminine", "Folk", "Formal",
  "French", "Fun", "Funky", "Garconne", "Geek Chic", "Girl Next Door",
  "Glam", "Goth", "Granola", "Grunge", "Hipster", "Kooky", "Lagenlook",
  "Masculine", "Military", "Minimalist", "Modest", "Prairie", "Preppy",
  "Punk", "Racy", "Rocker", "Romantic", "Skateboard", "Sporty", "Street",
  "Traditional", "Vintage",
] as const;

export type WeatherTag = "hot" | "warm" | "mild" | "cool" | "cold" | "rainy" | "snowy" | "windy" | "stormy" | "sunny";

export interface SavedFit {
  id: string;
  label: string;
  mainOutfit: string;
  outerwear?: string;
  accessories: string[];
  style: StylePreference;
  fitScore: number;
  weatherTags: WeatherTag[];
  savedAt: number;
}

export interface LocationData {
  name: string;
  lat: number;
  lon: number;
}

export interface ClosetItem {
  id: string;
  name: string;
  category: Category;
  imageId: string | null;
  styles: StylePreference[];
  createdAt: number;
}

export interface ClosetData {
  tops: ClosetItem[];
  bottoms: ClosetItem[];
  outerwear: ClosetItem[];
  shoes: ClosetItem[];
  accessories: ClosetItem[];
}

export interface FitCheckSettings {
  onboarded: boolean;
  location: LocationData | null;
  units: "f" | "c";
  style: StylePreference;
  styleTypes: string[];
  closet: ClosetData;
  theme: ThemePreference;
  voiceName: string | null;
  notificationsEnabled: boolean;
  morningAlertTime: string;
  savedFits: SavedFit[];
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
    shoes: [],
    accessories: []
  },
  styleTypes: [],
  theme: "system",
  voiceName: null,
  notificationsEnabled: false,
  morningAlertTime: "08:00",
  savedFits: []
};

export function getSettings(): FitCheckSettings {
  try {
    const onboarded = localStorage.getItem("fitcheck.onboarded") === "true";
    const locRaw = localStorage.getItem("fitcheck.location");
    const location = locRaw ? JSON.parse(locRaw) : null;
    const units = (localStorage.getItem("fitcheck.units") as "f" | "c") || "f";
    const style = (localStorage.getItem("fitcheck.style") as StylePreference) || "Casual";
    const closetRaw = localStorage.getItem("fitcheck.closet");
    
    let closet: ClosetData = DEFAULT_SETTINGS.closet;
    if (closetRaw) {
      const parsed = JSON.parse(closetRaw);
      // Migration from old string[] shape
      const migrateCategory = (items: any[], cat: Category): ClosetItem[] => {
        if (!items) return [];
        return items.map(item => {
          if (typeof item === 'string') {
            return {
              id: crypto.randomUUID(),
              name: item,
              category: cat,
              imageId: null,
              styles: [style],
              createdAt: Date.now()
            };
          }
          return item as ClosetItem;
        });
      };
      
      closet = {
        tops: migrateCategory(parsed.tops, "tops"),
        bottoms: migrateCategory(parsed.bottoms, "bottoms"),
        outerwear: migrateCategory(parsed.outerwear, "outerwear"),
        shoes: migrateCategory(parsed.shoes, "shoes"),
        accessories: migrateCategory(parsed.accessories ?? [], "accessories"),
      };
    }
    const theme = (localStorage.getItem("fitcheck.theme") as ThemePreference) || "system";
    const voiceName = localStorage.getItem("fitcheck.voiceName") || null;
    const notificationsEnabled = localStorage.getItem("fitcheck.notificationsEnabled") === "true";
    const morningAlertTime = localStorage.getItem("fitcheck.morningAlertTime") || "08:00";
    
    const savedFitsRaw = localStorage.getItem("fitcheck.savedFits");
    const savedFits: SavedFit[] = savedFitsRaw ? JSON.parse(savedFitsRaw) : [];

    const styleTypesRaw = localStorage.getItem("fitcheck.styleTypes");
    const styleTypes: string[] = styleTypesRaw ? JSON.parse(styleTypesRaw) : [];

    return { onboarded, location, units, style, styleTypes, closet, theme, voiceName, notificationsEnabled, morningAlertTime, savedFits };
  } catch (e) {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: Partial<FitCheckSettings>) {
  if (settings.onboarded !== undefined) localStorage.setItem("fitcheck.onboarded", String(settings.onboarded));
  if (settings.location !== undefined) localStorage.setItem("fitcheck.location", JSON.stringify(settings.location));
  if (settings.units !== undefined) localStorage.setItem("fitcheck.units", settings.units);
  if (settings.style !== undefined) localStorage.setItem("fitcheck.style", settings.style);
  if (settings.styleTypes !== undefined) localStorage.setItem("fitcheck.styleTypes", JSON.stringify(settings.styleTypes));
  if (settings.closet !== undefined) localStorage.setItem("fitcheck.closet", JSON.stringify(settings.closet));
  if (settings.theme !== undefined) localStorage.setItem("fitcheck.theme", settings.theme);
  if (settings.notificationsEnabled !== undefined) localStorage.setItem("fitcheck.notificationsEnabled", String(settings.notificationsEnabled));
  if (settings.morningAlertTime !== undefined) localStorage.setItem("fitcheck.morningAlertTime", settings.morningAlertTime);
  if (settings.savedFits !== undefined) localStorage.setItem("fitcheck.savedFits", JSON.stringify(settings.savedFits));
  if (settings.voiceName !== undefined) {
    if (settings.voiceName === null) {
      localStorage.removeItem("fitcheck.voiceName");
    } else {
      localStorage.setItem("fitcheck.voiceName", settings.voiceName);
    }
  }
  
  // Dispatch an event so hooks can re-render
  window.dispatchEvent(new Event("fitcheck.settings.updated"));
}
