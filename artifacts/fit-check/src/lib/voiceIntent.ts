export interface VoiceIntent {
  type: "today" | "morning" | "afternoon" | "evening" | "tomorrow" | "rain" | "warmth" | "general";
  raw: string;
}

export function parseVoiceQuestion(transcript: string): VoiceIntent {
  const lower = transcript.toLowerCase();
  
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
