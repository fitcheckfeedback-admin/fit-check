import { useEffect, useState } from "react";
import { rankVoices, type RankedVoice } from "@/lib/voicePicker";

export function useVoices(): { voices: SpeechSynthesisVoice[]; ranked: RankedVoice[]; loading: boolean } {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      setLoading(false);
      return;
    }

    let mounted = true;

    const load = () => {
      const all = window.speechSynthesis.getVoices();
      if (!mounted) return;
      if (all.length > 0) {
        setVoices(all);
        setLoading(false);
      }
    };

    load();
    window.speechSynthesis.addEventListener("voiceschanged", load);

    // Some browsers (esp. iOS Safari) need a delayed retry
    const retries = [200, 500, 1000, 2000].map(ms => setTimeout(load, ms));

    return () => {
      mounted = false;
      window.speechSynthesis.removeEventListener("voiceschanged", load);
      retries.forEach(clearTimeout);
    };
  }, []);

  return { voices, ranked: rankVoices(voices), loading };
}
