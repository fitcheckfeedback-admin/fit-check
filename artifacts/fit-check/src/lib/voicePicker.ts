// Browser voice ranking — prioritize premium/neural voices when the device has them.

export interface RankedVoice {
  voice: SpeechSynthesisVoice;
  quality: "premium" | "enhanced" | "standard";
  label: string;
  sublabel: string;
}

const PREMIUM_PATTERNS = [
  /natural/i, /\(natural\)/i, /online \(natural\)/i,
  /premium/i, /enhanced/i,
  /siri/i, /\(siri/i,
  /neural/i,
  /multilingual/i,
];

const ENHANCED_NAME_HINTS = [
  /samantha/i, /ava/i, /aria/i, /jenny/i, /guy/i,
  /allison/i, /susan/i, /tom/i, /alex/i, /karen/i, /moira/i,
  /serena/i, /daniel/i, /fiona/i, /tessa/i, /veena/i,
  /google\s+(us|uk|english)/i,
  /microsoft.*online/i,
];

export function classifyVoice(v: SpeechSynthesisVoice): "premium" | "enhanced" | "standard" {
  if (PREMIUM_PATTERNS.some(re => re.test(v.name))) return "premium";
  if (ENHANCED_NAME_HINTS.some(re => re.test(v.name))) return "enhanced";
  return "standard";
}

function cleanLabel(name: string): string {
  // Strip noisy suffixes for nicer display
  return name
    .replace(/Microsoft\s+/i, "")
    .replace(/Google\s+/i, "")
    .replace(/\s*-\s*English.*$/i, "")
    .replace(/\(.*?\)/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function qualityLabel(q: "premium" | "enhanced" | "standard"): string {
  if (q === "premium") return "Premium";
  if (q === "enhanced") return "Enhanced";
  return "Standard";
}

export function rankVoices(all: SpeechSynthesisVoice[]): RankedVoice[] {
  const english = all.filter(v => v.lang.toLowerCase().startsWith("en"));

  const ranked: RankedVoice[] = english.map(v => {
    const quality = classifyVoice(v);
    return {
      voice: v,
      quality,
      label: cleanLabel(v.name) || v.name,
      sublabel: `${qualityLabel(quality)} · ${v.lang}`,
    };
  });

  // Sort: premium > enhanced > standard, then by name
  const order = { premium: 0, enhanced: 1, standard: 2 } as const;
  ranked.sort((a, b) => {
    if (order[a.quality] !== order[b.quality]) return order[a.quality] - order[b.quality];
    return a.label.localeCompare(b.label);
  });

  return ranked;
}

export function pickAutoVoice(all: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  const ranked = rankVoices(all);
  return ranked[0]?.voice ?? all[0] ?? null;
}

export function findVoiceByName(all: SpeechSynthesisVoice[], name: string | null | undefined): SpeechSynthesisVoice | null {
  if (!name) return null;
  return all.find(v => v.name === name) ?? null;
}
