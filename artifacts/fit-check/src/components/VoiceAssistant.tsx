import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, X } from "lucide-react";
import { useVoiceAssistant } from "@/hooks/useVoiceAssistant";
import { parseVoiceQuestion } from "@/lib/voiceIntent";
import { buildVoiceAnswer } from "@/lib/voiceAnswer";
import { useToast } from "@/hooks/use-toast";
import { WeatherForecastResponse } from "@/lib/weather";
import { Recommendation } from "@/lib/recommend";
import { FitCheckSettings } from "@/lib/storage";

interface VoiceAssistantProps {
  weatherData: WeatherForecastResponse | null;
  recommendation: Recommendation | null;
  settings: FitCheckSettings;
  autoStart?: boolean;
  onCloseAutoStart?: () => void;
}

const HINTS = [
  "Try: 'What should I wear today?'",
  "Try: 'Will it rain?'",
  "Try: 'What about tomorrow?'",
  "Try: 'Is it cold outside?'"
];

export function VoiceAssistant({ weatherData, recommendation, settings, autoStart, onCloseAutoStart }: VoiceAssistantProps) {
  const { isSupported, isListening, isSpeaking, transcript, startListening, stopListening, speak, cancelSpeech } = useVoiceAssistant();
  const [isOpen, setIsOpen] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const [hintIndex, setHintIndex] = useState(0);
  const { toast } = useToast();
  const answerTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (autoStart && isSupported && !isOpen) {
      setTimeout(() => {
        setIsOpen(true);
        startListening();
        if (onCloseAutoStart) onCloseAutoStart();
      }, 300);
    }
  }, [autoStart, isSupported, isOpen, startListening, onCloseAutoStart]);

  useEffect(() => {
    if (isOpen) {
      const interval = setInterval(() => {
        setHintIndex((prev) => (prev + 1) % HINTS.length);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && !isListening && transcript && !isSpeaking && !answer) {
      if (weatherData && recommendation) {
        const intent = parseVoiceQuestion(transcript);
        const ans = buildVoiceAnswer(intent, weatherData, recommendation, settings);
        setAnswer(ans);
        speak(ans);
      }
    }
  }, [isOpen, isListening, transcript, isSpeaking, answer, weatherData, recommendation, settings, speak]);

  useEffect(() => {
    if (isOpen && answer && !isSpeaking) {
      answerTimeoutRef.current = setTimeout(() => {
        handleClose();
      }, 20000);
    }
    return () => {
      if (answerTimeoutRef.current) clearTimeout(answerTimeoutRef.current);
    };
  }, [isOpen, answer, isSpeaking]);

  const handleOpen = () => {
    if (!isSupported) {
      toast({
        title: "Voice not supported",
        description: "Try using Safari or Chrome to use the voice assistant.",
      });
      return;
    }
    setIsOpen(true);
    setAnswer(null);
    startListening();
  };

  const handleClose = () => {
    stopListening();
    cancelSpeech();
    setIsOpen(false);
    setAnswer(null);
  };

  if (!isSupported && !autoStart) return null;

  return (
    <>
      <div className="fixed bottom-24 right-6 z-40">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleOpen}
          aria-label="Ask what to wear"
          className="w-16 h-16 rounded-full bg-gradient-to-tr from-primary to-amber-300 shadow-[0_8px_32px_rgba(245,158,11,0.4)] flex items-center justify-center text-primary-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        >
          <Mic className="w-7 h-7" />
        </motion.button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/90 backdrop-blur-xl p-6"
            onClick={handleClose}
          >
            <button 
              onClick={handleClose}
              className="absolute top-8 right-8 p-3 rounded-full bg-muted/50 hover:bg-muted text-muted-foreground transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            <div 
              className="flex flex-col items-center max-w-sm w-full space-y-12"
              onClick={e => e.stopPropagation()}
            >
              <div className="relative flex items-center justify-center w-48 h-48">
                <motion.div
                  animate={{
                    scale: isListening ? [1, 1.5, 1] : isSpeaking ? [1, 1.1, 1] : 1,
                    opacity: isListening ? [0.3, 0.6, 0.3] : isSpeaking ? [0.4, 0.5, 0.4] : 0.2,
                  }}
                  transition={{
                    duration: isListening ? 1.5 : isSpeaking ? 2 : 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="absolute inset-0 rounded-full bg-primary/40 blur-2xl"
                />
                <motion.div
                  animate={{
                    scale: isListening ? [1, 1.2, 1] : 1,
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="relative z-10 w-24 h-24 rounded-full bg-gradient-to-tr from-primary to-amber-300 shadow-[0_0_40px_rgba(245,158,11,0.5)] flex items-center justify-center text-primary-foreground"
                >
                  <Mic className="w-10 h-10" />
                </motion.div>
              </div>

              <div className="text-center space-y-6 min-h-[160px] flex flex-col justify-center">
                {answer ? (
                  <motion.p 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-2xl font-display font-medium text-foreground leading-tight"
                  >
                    {answer}
                  </motion.p>
                ) : (
                  <>
                    <p className="text-3xl font-display font-bold text-foreground min-h-[80px]">
                      {transcript || (isListening ? "Listening..." : "Processing...")}
                    </p>
                    {isListening && !transcript && (
                      <AnimatePresence mode="wait">
                        <motion.p
                          key={hintIndex}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          className="text-muted-foreground font-medium"
                        >
                          {HINTS[hintIndex]}
                        </motion.p>
                      </AnimatePresence>
                    )}
                  </>
                )}
              </div>

              {answer && !isSpeaking && (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={handleClose}
                  className="px-8 py-3 rounded-full bg-foreground text-background font-semibold hover:bg-foreground/90 transition-colors"
                >
                  Done
                </motion.button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
