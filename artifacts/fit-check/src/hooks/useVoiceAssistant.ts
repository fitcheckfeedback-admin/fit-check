import { useState, useEffect, useCallback, useRef } from 'react';
import { isNativeTts } from '@/lib/tts';

interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
}

declare global {
  interface Window {
    SpeechRecognition?: { new (): SpeechRecognition };
    webkitSpeechRecognition?: { new (): SpeechRecognition };
  }
}

// Safety net: if the recognizer wedges (no end/error event), force a reset
// instead of leaving the UI stuck on "Listening..." forever.
const WATCHDOG_MS = 30000;

export function useVoiceAssistant() {
  const [isSupported, setIsSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const watchdogRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    // Speech input needs the Web Speech API; speech output works through the
    // native VoiceTTS plugin on iOS or speechSynthesis on web.
    if (SR && (window.speechSynthesis || isNativeTts())) {
      setIsSupported(true);
    }
    return () => {
      try { recognitionRef.current?.abort(); } catch { /* ignore */ }
      recognitionRef.current = null;
      if (watchdogRef.current) clearTimeout(watchdogRef.current);
      watchdogRef.current = null;
    };
  }, []);

  const teardownRecognition = useCallback(() => {
    if (watchdogRef.current) {
      clearTimeout(watchdogRef.current);
      watchdogRef.current = null;
    }
    const r = recognitionRef.current;
    recognitionRef.current = null;
    if (r) {
      try { r.abort(); } catch { /* ignore */ }
    }
  }, []);

  const startListening = useCallback(() => {
    if (typeof window === 'undefined') return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setError('Voice input is not supported here');
      return;
    }
    // Always start a FRESH recognition instance. Reusing one instance across
    // sessions wedges iOS's speech recognizer: the second start() fires
    // onstart but never delivers results or onend, leaving the UI stuck on
    // "Listening..." until the app restarts.
    teardownRecognition();
    setError(null);
    setTranscript('');

    const recognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognitionRef.current = recognition;

    // Guard every handler: events from a torn-down (aborted) instance must
    // not touch the state of the session that replaced it.
    const isCurrent = () => recognitionRef.current === recognition;
    const finishSession = () => {
      if (watchdogRef.current) {
        clearTimeout(watchdogRef.current);
        watchdogRef.current = null;
      }
      recognitionRef.current = null;
      setIsListening(false);
    };

    recognition.onstart = () => {
      if (!isCurrent()) return;
      setIsListening(true);
      setError(null);
    };
    recognition.onend = () => {
      if (!isCurrent()) return;
      finishSession();
    };
    recognition.onerror = (e: SpeechRecognitionErrorEvent) => {
      if (!isCurrent()) return;
      if (e.error === 'no-speech') {
        setError("I didn't catch that — try again");
      } else if (e.error !== 'aborted') {
        setError(e.error);
      }
      finishSession();
    };
    recognition.onresult = (e: SpeechRecognitionEvent) => {
      if (!isCurrent()) return;
      let current = '';
      for (let i = e.resultIndex; i < e.results.length; ++i) {
        current += e.results[i][0].transcript;
      }
      setTranscript(current);
    };

    try {
      recognition.start();
      watchdogRef.current = setTimeout(() => {
        watchdogRef.current = null;
        // The recognizer wedged: no end/error arrived. Force a reset so the
        // user can try again instead of staring at "Listening..." forever.
        teardownRecognition();
        setIsListening(false);
        setError('The microphone got stuck — try again');
      }, WATCHDOG_MS);
    } catch (e: any) {
      teardownRecognition();
      setError(e?.message || 'Failed to start listening');
    }
  }, [teardownRecognition]);

  const stopListening = useCallback(() => {
    teardownRecognition();
    setIsListening(false);
  }, [teardownRecognition]);

  const speak = useCallback(async (text: string, voiceName?: string | null) => {
    // All spoken audio routes through the unified TTS module: cloud
    // "Fit Check Voice" when reachable, native AVSpeech voices otherwise.
    const { speak: ttsSpeak } = await import('@/lib/tts');
    await ttsSpeak(text, {
      voiceId: voiceName ?? null,
      onStart: () => setIsSpeaking(true),
      onEnd: () => setIsSpeaking(false),
    });
  }, []);

  const cancelSpeech = useCallback(() => {
    import('@/lib/tts').then(m => m.stopSpeaking());
    setIsSpeaking(false);
  }, []);

  return {
    isSupported,
    isListening,
    isSpeaking,
    transcript,
    error,
    startListening,
    stopListening,
    speak,
    cancelSpeech,
  };
}
