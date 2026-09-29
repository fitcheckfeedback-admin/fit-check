import { useEffect, useState } from "react";
import { listVoices, type TtsVoice } from "@/lib/tts";

/**
 * Every real, available voice on this device, best first.
 * On Capacitor iOS these are the native AVSpeech voices (with true
 * neural/enhanced quality from the OS); on web they're the ranked
 * speechSynthesis voices. Never invented — only what listVoices() returns.
 */
export function useVoices(): { voices: TtsVoice[]; ranked: TtsVoice[]; loading: boolean } {
  const [voices, setVoices] = useState<TtsVoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const all = await listVoices();
        if (!mounted) return;
        if (all.length > 0) {
          setVoices(all);
          setLoading(false);
        }
      } catch {
        if (mounted) setLoading(false);
      }
    };

    load();

    // Web voices can arrive late (esp. iOS Safari) — retry + listen.
    const retry = setTimeout(load, 1500);
    const onVoicesChanged = () => load();
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.addEventListener("voiceschanged", onVoicesChanged);
    }

    return () => {
      mounted = false;
      clearTimeout(retry);
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.removeEventListener("voiceschanged", onVoicesChanged);
      }
    };
  }, []);

  return { voices, ranked: voices, loading };
}
