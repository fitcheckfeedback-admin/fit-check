import { StylePreference } from "./storage";
import { formatHashtagsForShare } from "./fitCardHashtags";

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
  return `${data.date} FIT✔️ — ${data.location}

Today I'm wearing: ${data.mainOutfit}
${data.outerwear ? "Layer: " + data.outerwear : ""}
Accessories: ${data.accessories.join(", ")}
Fit Score: ${data.fitScore}/100

${formatHashtagsForShare(hashtags)}`;
}
