// Browser voice ranking — prioritize premium/neural voices when the device has them.

export type VoiceQuality = "neural" | "enhanced" | "standard";

export interface RankedVoice {
  voice: SpeechSynthesisVoice;
  quality: VoiceQuality;
  label: string;
  sublabel: string;
}

const NEURAL_PATTERNS = [
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

export function classifyVoice(v: SpeechSynthesisVoice): VoiceQuality {
  if (NEURAL_PATTERNS.some(re => re.test(v.name))) return "neural";
  if (ENHANCED_NAME_HINTS.some(re => re.test(v.name))) return "enhanced";
  return "standard";
}

export function cleanVoiceLabel(name: string): string {
  // Strip noisy suffixes for nicer display
  return name
    .replace(/Microsoft\s+/i, "")
    .replace(/Google\s+/i, "")
    .replace(/\s*-\s*English.*$/i, "")
    .replace(/\(.*?\)/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function qualityLabel(q: VoiceQuality): string {
  if (q === "neural") return "Neural";
  if (q === "enhanced") return "Enhanced";
  return "Standard";
}

export function rankVoices(all: SpeechSynthesisVoice[]): RankedVoice[] {
  const english = all.filter(v => v.lang.toLowerCase().startsWith("en"));

  const ranked: RankedVoice[] = english.map(v => {
    const quality = classifyVoice(v);
    const label = cleanVoiceLabel(v.name) || v.name;
    return {
      voice: v,
      quality,
      label,
      sublabel: `${qualityLabel(quality)} · ${v.lang}`,
    };
  });

  // Sort: neural > enhanced > standard, then by name
  const order: Record<VoiceQuality, number> = { neural: 0, enhanced: 1, standard: 2 };
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
