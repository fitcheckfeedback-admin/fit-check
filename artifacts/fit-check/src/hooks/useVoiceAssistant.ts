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
  const nativeListeningRef = useRef(false);

  useEffect(() => {
    if (isNative()) {
      // Native iOS — always mark as supported; permission checked on first use
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
      setError(e.error);
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

  const startListening = useCallback(async () => {
    setError(null);
    setTranscript('');

    if (isNative()) {
      try {
        const { SpeechRecognition: NativeSR } = await import('@capacitor-community/speech-recognition');
        const permResult = await NativeSR.requestPermission();
        if (permResult.speechRecognition !== 'granted' && permResult.speechRecognition !== undefined) {
          setError('Microphone permission denied');
          return;
        }
        nativeListeningRef.current = true;
        setIsListening(true);
        await NativeSR.start({
          language: 'en-US',
          maxResults: 1,
          partialResults: true,
          popup: false,
        });
        // Wait for final result
        const result = await NativeSR.stop();
        if (!nativeListeningRef.current) return;
        nativeListeningRef.current = false;
        const text = result?.matches?.[0] ?? '';
        setTranscript(text);
        setIsListening(false);
      } catch (e: any) {
        nativeListeningRef.current = false;
        setError(e.message || 'Voice recognition failed');
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
    if (isNative()) {
      try {
        nativeListeningRef.current = false;
        const { SpeechRecognition: NativeSR } = await import('@capacitor-community/speech-recognition');
        await NativeSR.stop();
      } catch {
        // ignore
      }
      setIsListening(false);
    } else {
      if (!recognitionRef.current) return;
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }
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
      } catch {
        // ignore
      }
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
