import { StylePreference } from "./storage";
import { formatHashtagsForShare } from "./fitCardHashtags";
import { formatTemp } from "./format";

export interface FitCardData {
  mainOutfit: string;
  closetDesc?: string;
  outerwear?: string;
  accessories: string[];
  fitScore: number;
  style: StylePreference;
  temperatureF: number;
  highF?: number;
  lowF?: number;
  feelsLikeF?: number;
  weatherLabel: string;
  location: string;
  date: string;
  hashtags: string[];
  units: "f" | "c";
  userPhoto?: string;
}

export function buildCaption(data: FitCardData, hashtags: string[]): string {
  const outfitText = data.closetDesc ?? data.mainOutfit;
  const tempDisplay = formatTemp(data.temperatureF, data.units);
  const hiLo = data.highF !== undefined && data.lowF !== undefined
    ? ` (↑${formatTemp(data.highF, data.units)} ↓${formatTemp(data.lowF, data.units)})`
    : "";

  const lines = [
    `${data.date} FIT✔️ — ${data.location}`,
    `🌡️ ${tempDisplay}${hiLo} · ${data.weatherLabel}`,
    ``,
    `Today I'm wearing: ${outfitText}`,
    data.outerwear && !data.closetDesc ? `Layer: ${data.outerwear}` : "",
    data.accessories.length ? `Accessories: ${data.accessories.join(", ")}` : "",
    `Fit Score: ${data.fitScore}/100`,
    ``,
    formatHashtagsForShare(hashtags),
  ].filter(l => l !== null && l !== undefined);

  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}
