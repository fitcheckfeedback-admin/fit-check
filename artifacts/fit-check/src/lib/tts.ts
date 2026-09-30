// Unified text-to-speech for FIT Check.
//
// On Capacitor iOS this routes through the native VoiceTTS plugin
// (AVSpeechSynthesizer — real device voices, including neural/premium ones).
// Everywhere else it falls back to window.speechSynthesis.
//
// ALL spoken audio in the app must go through speak()/stopSpeaking() here.
// Spoken copy itself lives in voiceAnswer.ts and is unchanged by this module.

import { Capacitor, registerPlugin } from "@capacitor/core";
import { rankVoices, pickAutoVoice, findVoiceByName, cleanVoiceLabel } from "./voicePicker";

export type TtsQuality = "neural" | "enhanced" | "standard";

export interface TtsVoice {
  /** Native: AVSpeech identifier. Web: SpeechSynthesisVoice.name (same thing we store). */
  id: string;
  name: string;
  label: string;
  sublabel: string;
  quality: TtsQuality;
  language: string;
}

export interface SpeakOptions {
  /** Voice id (native identifier, or web voice name). null/undefined = auto-pick best. */
  voiceId?: string | null;
  /** Web-scale rate, 1.0 = normal. Defaults: 1.0, or 0.95 for long readouts. */
  rate?: number;
  /** Web-scale pitch, 1.0 = normal. */
  pitch?: number;
  onStart?: () => void;
  onEnd?: () => void;
}

interface NativeVoiceInfo {
  id: string;
  name: string;
  language: string;
  quality: string;
}

interface VoiceTTSPlugin {
  getVoices(): Promise<{ voices: NativeVoiceInfo[] }>;
  speak(options: { text: string; voiceId?: string; rate?: number; pitch?: number }): Promise<void>;
  stop(): Promise<void>;
  /** Native speech recognition (iPhone dictation engine). Resolves with the final transcript. */
  startListening(): Promise<{ transcript: string }>;
  /** Ends the current listening session; the pending startListening resolves with what was heard. */
  stopListening(): Promise<void>;
  addListener(
    eventName: "ttsStart" | "ttsEnd" | "speechPartial",
    listener: (data?: { transcript?: string }) => void
  ): Promise<{ remove: () => void }>;
}

export const NativeTTS = registerPlugin<VoiceTTSPlugin>("VoiceTTS");

/**
 * Cloud voice: our own backend's /api/tts endpoint (human neural voice).
 * Set to the Railway deploy URL when it exists; empty string disables
 * the cloud path and the app uses on-device voices only.
 */
export const CLOUD_TTS_BASE = "https://api-production-9e7ca.up.railway.app";

export const CLOUD_VOICE_ID = "cloud-fitcheck-voice";

export function isCloudTtsConfigured(): boolean {
  return CLOUD_TTS_BASE.length > 0;
}

/** True when the native iOS VoiceTTS plugin is available. */
export function isNativeTts(): boolean {
  try {
    return (
      Capacitor.isNativePlatform() &&
      Capacitor.getPlatform() === "ios" &&
      Capacitor.isPluginAvailable("VoiceTTS")
    );
  } catch {
    return false;
  }
}

/**
 * True when the native plugin's speech-recognition methods are available.
 * The Swift methods ship in the same binary as the plugin itself, so the
 * plugin's presence is the feature check — no separate probing needed.
 */
export function isNativeListening(): boolean {
  return isNativeTts();
}

/** Default speaking rate: natural 1.0, slightly slower for long fit readouts. */
export function defaultRateFor(text: string): number {
  return text.length > 220 ? 0.95 : 1.0;
}

function qualityLabel(q: TtsQuality): string {
  if (q === "neural") return "Neural";
  if (q === "enhanced") return "Enhanced";
  return "Standard";
}

const QUALITY_ORDER: Record<TtsQuality, number> = { neural: 0, enhanced: 1, standard: 2 };

function normalizeQuality(q: string): TtsQuality {
  if (q === "neural" || q === "enhanced" || q === "standard") return q;
  return "standard";
}

/** Every real, available voice on this device, best first. Never invented. */
export async function listVoices(): Promise<TtsVoice[]> {
  const voices: TtsVoice[] = [];

  // Cloud "Fit Check Voice" first when our backend is configured — the
  // human neural voice, no downloads needed.
  if (isCloudTtsConfigured()) {
    voices.push({
      id: CLOUD_VOICE_ID,
      name: "Fit Check Voice",
      label: "Fit Check Voice",
      sublabel: "Human · online",
      quality: "neural",
      language: "en-US",
    });
  }

  if (isNativeTts()) {
    const { voices: nativeInfos } = await NativeTTS.getVoices();
    const native = nativeInfos
      .map((v): TtsVoice => {
        const quality = normalizeQuality(v.quality);
        const label = cleanVoiceLabel(v.name);
        return {
          id: v.id,
          name: v.name,
          label,
          sublabel: `${qualityLabel(quality)} · ${v.language}`,
          quality,
          language: v.language,
        };
      })
      .sort((a, b) =>
        QUALITY_ORDER[a.quality] !== QUALITY_ORDER[b.quality]
          ? QUALITY_ORDER[a.quality] - QUALITY_ORDER[b.quality]
          : a.label.localeCompare(b.label)
      );
    return [...voices, ...native];
  }

  // Web fallback: ranked speechSynthesis voices (English only).
  const all = typeof window !== "undefined" && window.speechSynthesis
    ? window.speechSynthesis.getVoices()
    : [];
  const web = rankVoices(all).map((rv): TtsVoice => ({
    id: rv.voice.name,
    name: rv.voice.name,
    label: rv.label,
    sublabel: rv.sublabel,
    quality: rv.quality,
    language: rv.voice.lang,
  }));
  return [...voices, ...web];
}

// ---- Cloud voice (our backend /api/tts — human neural voice) ----

let cloudAudio: HTMLAudioElement | null = null;
let cloudObjectUrl: string | null = null;

function stopCloudAudio(): void {
  if (cloudAudio) {
    try {
      cloudAudio.pause();
      cloudAudio.src = "";
    } catch { /* ignore */ }
    cloudAudio = null;
  }
  if (cloudObjectUrl) {
    try { URL.revokeObjectURL(cloudObjectUrl); } catch { /* ignore */ }
    cloudObjectUrl = null;
  }
}

/**
 * Speak via the cloud human voice. Returns true when audio actually
 * started playing; false when the cloud path is unavailable so the
 * caller falls back to on-device voices.
 */
async function speakCloud(text: string, opts: SpeakOptions): Promise<boolean> {
  if (!isCloudTtsConfigured()) return false;
  try {
    stopCloudAudio();
    const res = await fetch(`${CLOUD_TTS_BASE}/api/tts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) return false;
    const blob = await res.blob();
    if (!blob.size) return false;
    cloudObjectUrl = URL.createObjectURL(blob);
    const audio = new Audio(cloudObjectUrl);
    cloudAudio = audio;
    const done = () => {
      if (cloudAudio === audio) stopCloudAudio();
      opts.onEnd?.();
    };
    audio.onended = done;
    audio.onerror = done;
    opts.onStart?.();
    await audio.play();
    return true;
  } catch {
    stopCloudAudio();
    return false;
  }
}

// ---- Native event plumbing (one subscription, per-call callbacks) ----

let listenersEnsured = false;
let currentCall: { onStart?: () => void; onEnd?: () => void } | null = null;

async function ensureNativeListeners(): Promise<void> {
  if (listenersEnsured || !isNativeTts()) return;
  listenersEnsured = true;
  try {
    await NativeTTS.addListener("ttsStart", () => {
      currentCall?.onStart?.();
    });
    await NativeTTS.addListener("ttsEnd", () => {
      const c = currentCall;
      currentCall = null;
      c?.onEnd?.();
    });
  } catch {
    listenersEnsured = false;
  }
}

function speakWeb(text: string, opts: SpeakOptions): void {
  const synth = window.speechSynthesis;
  if (!synth) {
    opts.onEnd?.();
    return;
  }
  synth.cancel();
  const utterance = new SpeechSynthesisUtterance(text);

  const voices = synth.getVoices();
  if (voices.length > 0) {
    const chosen = findVoiceByName(voices, opts.voiceId ?? null) ?? pickAutoVoice(voices);
    if (chosen) utterance.voice = chosen;
  } else {
    // Voices not loaded yet — pick once they arrive.
    synth.addEventListener(
      "voiceschanged",
      () => {
        const late = synth.getVoices();
        const chosen = findVoiceByName(late, opts.voiceId ?? null) ?? pickAutoVoice(late);
        if (chosen) utterance.voice = chosen;
      },
      { once: true }
    );
  }

  utterance.rate = opts.rate ?? defaultRateFor(text);
  utterance.pitch = opts.pitch ?? 1.0;
  utterance.volume = 1.0;
  utterance.onstart = () => opts.onStart?.();
  const done = () => opts.onEnd?.();
  utterance.onend = done;
  utterance.onerror = done;
  synth.speak(utterance);
}

/** Speak text aloud through the best available voice path. */
export async function speak(text: string, opts: SpeakOptions = {}): Promise<void> {
  const clean = text.trim();
  if (!clean) return;

  // Cloud human voice first when selected (or Auto with cloud configured).
  const wantCloud = opts.voiceId === CLOUD_VOICE_ID || (!opts.voiceId && isCloudTtsConfigured());
  if (wantCloud && (await speakCloud(clean, opts))) return;

  if (isNativeTts()) {
    await ensureNativeListeners();
    // New speech supersedes anything in flight.
    try { await NativeTTS.stop(); } catch { /* ignore */ }
    currentCall = { onStart: opts.onStart, onEnd: opts.onEnd };
    try {
      await NativeTTS.speak({
        text: clean,
        voiceId: opts.voiceId ?? undefined,
        rate: opts.rate ?? defaultRateFor(clean),
        pitch: opts.pitch ?? 1.0,
      });
    } catch {
      currentCall = null;
      opts.onEnd?.();
    }
    return;
  }

  speakWeb(clean, opts);
}

/** Stop any in-flight speech. */
export async function stopSpeaking(): Promise<void> {
  stopCloudAudio();
  if (isNativeTts()) {
    try { await NativeTTS.stop(); } catch { /* ignore */ }
    const c = currentCall;
    currentCall = null;
    c?.onEnd?.();
    return;
  }
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}
