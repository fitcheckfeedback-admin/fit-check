export interface VoiceIntent {
  type: "today" | "morning" | "afternoon" | "evening" | "tomorrow" | "rain" | "warmth" | "app" | "general";
  raw: string;
}

// Questions about the app and its contents (closet, wardrobe, saved fits).
// Checked first: "do I have a warm jacket" is a closet question, not a
// weather question — and the AI backend has the full closet in context.
const APP_KEYWORDS = [
  "closet",
  "wardrobe",
  "how many",
  "do i have",
  "what do i have",
  "my clothes",
  "my shirts",
  "my shirt",
  "my pants",
  "my shoes",
  "my jackets",
  "my jacket",
  "my tops",
  "my bottoms",
  "my outfits",
  "my outfit",
  "saved fit",
];

export function parseVoiceQuestion(transcript: string): VoiceIntent {
  const lower = transcript.toLowerCase();

  if (APP_KEYWORDS.some((k) => lower.includes(k))) {
    return { type: "app", raw: transcript };
  }

  if (lower.includes("tomorrow")) {
    return { type: "tomorrow", raw: transcript };
  }
  
  if (lower.includes("rain") || lower.includes("umbrella") || lower.includes("wet")) {
    return { type: "rain", raw: transcript };
  }
  
  if (lower.includes("cold") || lower.includes("warm") || lower.includes("hot") || lower.includes("jacket") || lower.includes("chilly") || lower.includes("freezing")) {
    return { type: "warmth", raw: transcript };
  }
  
  if (lower.includes("morning")) {
    return { type: "morning", raw: transcript };
  }
  
  if (lower.includes("afternoon")) {
    return { type: "afternoon", raw: transcript };
  }
  
  if (lower.includes("evening") || lower.includes("tonight") || lower.includes("night")) {
    return { type: "evening", raw: transcript };
  }
  
  return { type: "today", raw: transcript };
}
