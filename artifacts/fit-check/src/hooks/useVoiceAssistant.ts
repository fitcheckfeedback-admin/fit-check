import { useState, useEffect, useCallback, useRef } from 'react';
import { isNativeTts, isNativeListening, NativeTTS } from '@/lib/tts';

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

// Safety net: if listening wedges (no completion event), force a reset
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
  const partialHandleRef = useRef<{ remove: () => void } | null>(null);
  // Guards async completion: teardown bumps the id, so a stale session's
  // promise resolution can never touch the new session's state.
  const sessionRef = useRef(0);

  const clearWatchdog = useCallback(() => {
    if (watchdogRef.current) {
      clearTimeout(watchdogRef.current);
      watchdogRef.current = null;
    }
  }, []);

  const teardownListening = useCallback(() => {
    // Invalidate any in-flight session first.
    sessionRef.current += 1;
    clearWatchdog();
    // Web path.
    const r = recognitionRef.current;
    recognitionRef.current = null;
    if (r) {
      try { r.abort(); } catch { /* ignore */ }
    }
    // Native path.
    try { partialHandleRef.current?.remove(); } catch { /* ignore */ }
    partialHandleRef.current = null;
    if (isNativeListening()) {
      NativeTTS.stopListening().catch(() => { /* no session: harmless */ });
    }
    setIsListening(false);
  }, [clearWatchdog]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    // Speech input: the native iPhone dictation engine when available,
    // otherwise the Web Speech API. Speech output works through the unified
    // TTS module (cloud voice / native AVSpeech / speechSynthesis).
    if (isNativeListening() || (SR && (window.speechSynthesis || isNativeTts()))) {
      setIsSupported(true);
    }
    return () => {
      teardownListening();
    };
  }, [teardownListening]);

  const startWebListening = useCallback((mySession: number) => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setError('Voice input is not supported here');
      return;
    }
    const alive = () => sessionRef.current === mySession;
    // Always start a FRESH recognition instance. Reusing one instance across
    // sessions wedges iOS's speech recognizer: the second start() fires
    // onstart but never delivers results or onend, leaving the UI stuck on
    // "Listening..." until the app restarts.
    const recognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognitionRef.current = recognition;

    // Guard every handler: events from a torn-down (aborted) instance must
    // not touch the state of the session that replaced it.
    const isCurrent = () => alive() && recognitionRef.current === recognition;
    const finishSession = () => {
      clearWatchdog();
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
        teardownListening();
        setError('The microphone got stuck — try again');
      }, WATCHDOG_MS);
    } catch (e: any) {
      teardownListening();
      setError(e?.message || 'Failed to start listening');
    }
  }, [clearWatchdog, teardownListening]);

  const startNativeListening = useCallback((mySession: number) => {
    const alive = () => sessionRef.current === mySession;
    // Live interim transcripts for the UI.
    NativeTTS.addListener('speechPartial', (data) => {
      if (alive() && data?.transcript) setTranscript(data.transcript);
    }).then(
      (handle) => {
        if (alive()) {
          partialHandleRef.current = handle;
        } else {
          try { handle.remove(); } catch { /* ignore */ }
        }
      },
      () => { /* listener attach failed: final transcript still resolves */ }
    );

    setIsListening(true);
    setError(null);
    watchdogRef.current = setTimeout(() => {
      watchdogRef.current = null;
      teardownListening();
      setError('The microphone got stuck — try again');
    }, WATCHDOG_MS);

    NativeTTS.startListening().then(
      (res) => {
        if (!alive()) return;
        clearWatchdog();
        try { partialHandleRef.current?.remove(); } catch { /* ignore */ }
        partialHandleRef.current = null;
        setIsListening(false);
        const text = (res?.transcript ?? '').trim();
        if (text) {
          setTranscript(text);
        } else {
          setError("I didn't catch that — try again");
        }
      },
      (err: any) => {
        if (!alive()) return;
        clearWatchdog();
        try { partialHandleRef.current?.remove(); } catch { /* ignore */ }
        partialHandleRef.current = null;
        setIsListening(false);
        const msg = err?.message || (typeof err === 'string' ? err : '') || 'Listening failed';
        setError(msg);
      }
    );
  }, [clearWatchdog, teardownListening]);

  const startListening = useCallback(() => {
    if (typeof window === 'undefined') return;
    teardownListening();
    setError(null);
    setTranscript('');
    const mySession = sessionRef.current;
    if (isNativeListening()) {
      startNativeListening(mySession);
    } else {
      startWebListening(mySession);
    }
  }, [teardownListening, startNativeListening, startWebListening]);

  const stopListening = useCallback(() => {
    teardownListening();
  }, [teardownListening]);

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
