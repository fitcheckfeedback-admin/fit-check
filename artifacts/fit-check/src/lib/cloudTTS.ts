// Cloud text-to-speech via /api/tts (OpenAI gpt-4o-mini-tts)

export const CLOUD_VOICES = [
  { id: "nova",    label: "Nova",    desc: "Warm, friendly female" },
  { id: "shimmer", label: "Shimmer", desc: "Bright, optimistic female" },
  { id: "coral",   label: "Coral",   desc: "Crisp, expressive female" },
  { id: "sage",    label: "Sage",    desc: "Calm, thoughtful female" },
  { id: "alloy",   label: "Alloy",   desc: "Smooth, neutral" },
  { id: "ballad",  label: "Ballad",  desc: "Soft, melodic" },
  { id: "ash",     label: "Ash",     desc: "Grounded, neutral" },
  { id: "echo",    label: "Echo",    desc: "Deep, conversational male" },
  { id: "onyx",    label: "Onyx",    desc: "Rich, authoritative male" },
  { id: "fable",   label: "Fable",   desc: "British storyteller" },
  { id: "verse",   label: "Verse",   desc: "Energetic, expressive" },
] as const;

export type CloudVoiceId = typeof CLOUD_VOICES[number]["id"];

export const DEFAULT_VOICE: CloudVoiceId = "nova";

export function isCloudVoice(name: string | null | undefined): name is CloudVoiceId {
  if (!name) return false;
  return CLOUD_VOICES.some(v => v.id === name);
}

let currentAudio: HTMLAudioElement | null = null;
let currentObjectUrl: string | null = null;

export function stopCloudSpeech() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.src = "";
    currentAudio = null;
  }
  if (currentObjectUrl) {
    URL.revokeObjectURL(currentObjectUrl);
    currentObjectUrl = null;
  }
}

export interface SpeakOptions {
  voice?: CloudVoiceId;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: Error) => void;
}

export async function speakWithCloud(text: string, options: SpeakOptions = {}): Promise<void> {
  const voice = options.voice ?? DEFAULT_VOICE;

  stopCloudSpeech();

  try {
    const res = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, voice }),
    });

    if (!res.ok) {
      throw new Error(`TTS request failed: ${res.status}`);
    }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    currentObjectUrl = url;

    const audio = new Audio(url);
    currentAudio = audio;

    audio.onplay = () => options.onStart?.();
    audio.onended = () => {
      options.onEnd?.();
      stopCloudSpeech();
    };
    audio.onerror = () => {
      options.onError?.(new Error("Audio playback failed"));
      stopCloudSpeech();
    };

    await audio.play();
  } catch (err) {
    options.onError?.(err as Error);
    stopCloudSpeech();
    throw err;
  }
}
