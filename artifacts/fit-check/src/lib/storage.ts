// src/lib/storage.ts

export type Category = "tops" | "bottoms" | "outerwear" | "shoes" | "accessories";
export type StylePreference = "Casual" | "Streetwear" | "Athletic" | "Workwear" | "Minimal";
export type GenderPreference = "male" | "female" | "unspecified";
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
  gender: GenderPreference;
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
  gender: "unspecified",
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
  // Each key is parsed independently: one corrupt value falls back to its own
  // default and can never wipe the user's other settings (or bounce them back
  // to onboarding).
  const safeGet = (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  };

  const safeParse = <T>(key: string, fallback: T, validate?: (v: unknown) => v is T): T => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      const parsed: unknown = JSON.parse(raw);
      return validate ? (validate(parsed) ? parsed : fallback) : (parsed as T);
    } catch {
      return fallback;
    }
  };

  const isStringArray = (v: unknown): v is string[] => Array.isArray(v) && v.every(x => typeof x === "string");

  const onboarded = safeGet("fitcheck.onboarded") === "true";

  const locationRaw = safeParse<unknown>("fitcheck.location", null);
  const location: LocationData | null =
    locationRaw !== null &&
    typeof locationRaw === "object" &&
    typeof (locationRaw as LocationData).lat === "number" &&
    typeof (locationRaw as LocationData).lon === "number"
      ? (locationRaw as LocationData)
      : null;

  const unitsRaw = safeGet("fitcheck.units");
  const units: "f" | "c" = unitsRaw === "c" || unitsRaw === "f" ? unitsRaw : "f";

  const styleRaw = safeGet("fitcheck.style");
  const style: StylePreference =
    styleRaw === "Casual" || styleRaw === "Streetwear" || styleRaw === "Athletic" ||
    styleRaw === "Workwear" || styleRaw === "Minimal"
      ? styleRaw
      : "Casual";

  const closetRaw = safeParse<unknown>("fitcheck.closet", null);
  let closet: ClosetData = DEFAULT_SETTINGS.closet;
  if (closetRaw !== null && typeof closetRaw === "object") {
    try {
      const parsed = closetRaw as Record<string, unknown>;
      // Migration from old string[] shape
      const migrateCategory = (items: unknown, cat: Category): ClosetItem[] => {
        if (!Array.isArray(items)) return [];
        return items.map(item => {
          if (typeof item === "string") {
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
    } catch {
      closet = DEFAULT_SETTINGS.closet;
    }
  }

  const themeRaw = safeGet("fitcheck.theme");
  const theme: ThemePreference =
    themeRaw === "light" || themeRaw === "dark" || themeRaw === "system" ? themeRaw : "system";

  const voiceName = safeGet("fitcheck.voiceName") || null;
  const notificationsEnabled = safeGet("fitcheck.notificationsEnabled") === "true";
  const morningAlertTime = safeGet("fitcheck.morningAlertTime") || "08:00";

  const savedFits = safeParse<SavedFit[]>("fitcheck.savedFits", [], (v): v is SavedFit[] => Array.isArray(v));
  const styleTypes = safeParse<string[]>("fitcheck.styleTypes", [], isStringArray);

  const genderRaw = safeGet("fitcheck.gender");
  const gender: GenderPreference =
    genderRaw === "male" || genderRaw === "female" || genderRaw === "unspecified"
      ? genderRaw
      : "unspecified";

  return { onboarded, location, units, style, styleTypes, gender, closet, theme, voiceName, notificationsEnabled, morningAlertTime, savedFits };
}

export function saveSettings(settings: Partial<FitCheckSettings>) {
  if (settings.onboarded !== undefined) localStorage.setItem("fitcheck.onboarded", String(settings.onboarded));
  if (settings.location !== undefined) localStorage.setItem("fitcheck.location", JSON.stringify(settings.location));
  if (settings.units !== undefined) localStorage.setItem("fitcheck.units", settings.units);
  if (settings.style !== undefined) localStorage.setItem("fitcheck.style", settings.style);
  if (settings.styleTypes !== undefined) localStorage.setItem("fitcheck.styleTypes", JSON.stringify(settings.styleTypes));
  if (settings.gender !== undefined) localStorage.setItem("fitcheck.gender", settings.gender);
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
