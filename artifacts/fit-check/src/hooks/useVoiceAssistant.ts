import { useState, useEffect, useCallback, useRef } from 'react';
import { isNative } from '@/lib/platform';

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
  const abortedRef = useRef(false);
  const latestTranscriptRef = useRef('');

  useEffect(() => {
    if (isNative()) {
      setIsSupported(true);
    } else if (typeof window !== 'undefined') {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SR && window.speechSynthesis) {
        setIsSupported(true);
        const recognition = new SR();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        recognitionRef.current = recognition;
      }
    }
  }, []);

  // Web Speech API event wiring
  useEffect(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;

    const handleStart = () => setIsListening(true);
    const handleEnd = () => setIsListening(false);
    const handleError = (e: SpeechRecognitionErrorEvent) => {
      setError(e.error === 'no-speech' ? "I didn't catch that — try again" : e.error);
      setIsListening(false);
    };
    const handleResult = (e: SpeechRecognitionEvent) => {
      let current = '';
      for (let i = e.resultIndex; i < e.results.length; ++i) {
        current += e.results[i][0].transcript;
      }
      setTranscript(current);
      latestTranscriptRef.current = current;
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

  const startListening = useCallback(async () => {
    setError(null);
    setTranscript('');
    latestTranscriptRef.current = '';
    abortedRef.current = false;

    if (isNative()) {
      try {
        const { SpeechRecognition: NativeSR } = await import('@capacitor-community/speech-recognition');

        const permResult = await NativeSR.requestPermission();
        // requestPermission returns void in v7 — if it throws, permission was denied
        
        setIsListening(true);

        // Listen for partial results as they stream in
        const handle = await NativeSR.addListener('partialResults', (data: { matches: string[] }) => {
          const text = data.matches?.[0]?.trim() ?? '';
          if (text) {
            setTranscript(text);
            latestTranscriptRef.current = text;
          }
        });

        // start() kicks off recognition; on iOS it ends automatically after silence
        await NativeSR.start({
          language: 'en-US',
          maxResults: 2,
          partialResults: true,
          popup: false,
        });

        // Clean up listener
        await handle.remove();

        if (abortedRef.current) return;

        // Use whatever was captured via partialResults
        const finalText = latestTranscriptRef.current;
        if (!finalText) {
          setError("I didn't catch that — try again");
        } else {
          setTranscript(finalText);
        }
      } catch (e: any) {
        if (!abortedRef.current) {
          setError(e.message || 'Voice recognition failed');
        }
      } finally {
        setIsListening(false);
      }
    } else {
      if (!recognitionRef.current) return;
      try {
        recognitionRef.current.start();
      } catch (e: any) {
        setError(e.message || 'Failed to start listening');
      }
    }
  }, []);

  const stopListening = useCallback(async () => {
    abortedRef.current = true;
    if (isNative()) {
      try {
        const { SpeechRecognition: NativeSR } = await import('@capacitor-community/speech-recognition');
        await NativeSR.stop();
      } catch { /* ignore */ }
    } else {
      try { recognitionRef.current?.stop(); } catch { /* ignore */ }
    }
    setIsListening(false);
  }, []);

  const speak = useCallback(async (text: string, voiceName?: string | null) => {
    if (isNative()) {
      try {
        const { TextToSpeech } = await import('@capacitor-community/text-to-speech');
        setIsSpeaking(true);
        await TextToSpeech.speak({
          text,
          lang: 'en-US',
          rate: 0.97,
          pitch: 1.0,
          volume: 1.0,
          category: 'ambient',
        });
        setIsSpeaking(false);
      } catch {
        setIsSpeaking(false);
      }
    } else {
      if (!window.speechSynthesis) return;
      const { findVoiceByName, pickAutoVoice } = await import('@/lib/voicePicker');
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      const setVoice = () => {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length === 0) return;
        const chosen = findVoiceByName(voices, voiceName) ?? pickAutoVoice(voices);
        if (chosen) utterance.voice = chosen;
      };
      setVoice();
      if (window.speechSynthesis.getVoices().length === 0) {
        window.speechSynthesis.addEventListener('voiceschanged', setVoice, { once: true });
      }
      utterance.rate = 0.97;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  const cancelSpeech = useCallback(async () => {
    if (isNative()) {
      try {
        const { TextToSpeech } = await import('@capacitor-community/text-to-speech');
        await TextToSpeech.stop();
      } catch { /* ignore */ }
    } else if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
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
