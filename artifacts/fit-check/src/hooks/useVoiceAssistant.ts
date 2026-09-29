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

export function useVoiceAssistant() {
  const [isSupported, setIsSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    // Speech input needs the Web Speech API; speech output works through the
    // native VoiceTTS plugin on iOS or speechSynthesis on web.
    if (SR && (window.speechSynthesis || isNativeTts())) {
      setIsSupported(true);
      const recognition = new SR();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognitionRef.current = recognition;
    }
  }, []);

  useEffect(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;

    const handleStart = () => {
      setIsListening(true);
      setError(null);
    };
    const handleEnd = () => setIsListening(false);
    const handleError = (e: SpeechRecognitionErrorEvent) => {
      if (e.error === 'no-speech') {
        setError("I didn't catch that — try again");
      } else if (e.error !== 'aborted') {
        setError(e.error);
      }
      setIsListening(false);
    };
    const handleResult = (e: SpeechRecognitionEvent) => {
      let current = '';
      for (let i = e.resultIndex; i < e.results.length; ++i) {
        current += e.results[i][0].transcript;
      }
      setTranscript(current);
    };

    recognition.addEventListener('start', handleStart);
    recognition.addEventListener('end', handleEnd);
    recognition.addEventListener('error', handleError as any);
    recognition.addEventListener('result', handleResult as any);

    return () => {
      recognition.removeEventListener('start', handleStart);
      recognition.removeEventListener('end', handleEnd);
      recognition.removeEventListener('error', handleError as any);
      recognition.removeEventListener('result', handleResult as any);
    };
  }, [isSupported]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) return;
    setError(null);
    setTranscript('');
    try {
      recognitionRef.current.start();
    } catch (e: any) {
      setError(e.message || 'Failed to start listening');
    }
  }, []);

  const stopListening = useCallback(() => {
    try { recognitionRef.current?.stop(); } catch { /* ignore */ }
    setIsListening(false);
  }, []);

  const speak = useCallback(async (text: string, voiceName?: string | null) => {
    // All spoken audio routes through the unified TTS module: native
    // AVSpeech voices on Capacitor iOS, speechSynthesis everywhere else.
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
