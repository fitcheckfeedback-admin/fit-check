import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, X } from "lucide-react";
import { useVoiceAssistant } from "@/hooks/useVoiceAssistant";
import { parseVoiceQuestion } from "@/lib/voiceIntent";
import { buildVoiceAnswer } from "@/lib/voiceAnswer";
import { buildAiContext } from "@/lib/appContext";
import { fetchDeals, Deal } from "@/lib/deals";
import { DealResults } from "@/components/DealResults";
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
  "Try: 'Is it cold outside?'",
  "Try: 'How many shirts are in my closet?'",
  "Try: 'Find me deals on jeans'"
];

export function VoiceAssistant({ weatherData, recommendation, settings, autoStart, onCloseAutoStart }: VoiceAssistantProps) {
  const { isSupported, isListening, isSpeaking, transcript, error, setError, startListening, stopListening, speak, cancelSpeech } = useVoiceAssistant();
  const [isOpen, setIsOpen] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const [dealResults, setDealResults] = useState<Deal[] | null>(null);
  const [isThinking, setIsThinking] = useState(false);
  const [hintIndex, setHintIndex] = useState(0);
  const { toast } = useToast();
  const answerTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // Conversation state: lets follow-ups ("yes, list them") make sense.
  const historyRef = useRef<{ role: "user" | "assistant"; content: string }[]>([]);
  const lastWasAppRef = useRef(false);
  // Auto follow-up: when the assistant ends its reply with a question, the
  // mic reopens automatically so Joshua can answer in the same session
  // instead of closing and starting over. One auto round per answer.
  const autoFollowedUpRef = useRef(false);

  function resetConversation() {
    historyRef.current = [];
    lastWasAppRef.current = false;
    autoFollowedUpRef.current = false;
    setDealResults(null);
  }

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
    return undefined;
  }, [isOpen]);

  // Pro-only: phrases that mean "search the web for clothing deals".
  const DEAL_RE = /\bdeals?\b|\bsale\b|\bdiscount\b|\bcheapest\b|\bcoupon\b|where can i buy|find me.*(cheap|deal)/i;

  useEffect(() => {
    if (!isOpen || isListening || !transcript || isSpeaking || answer) return;
    // Follow-ups to an AI turn stay with the AI: the local weather builder
    // can't interpret "yes" or "list them", but the backend can with history.
    // Deal asks are fresh questions (not follow-ups) matching deal keywords.
    const isDealAsk = !lastWasAppRef.current && DEAL_RE.test(transcript);
    const intent = lastWasAppRef.current
      ? { type: "app" as const, raw: transcript }
      : parseVoiceQuestion(transcript);
    autoFollowedUpRef.current = false;

    if (isDealAsk) {
      // Live web deal search (Pro). Follow-ups ("tell me more about the
      // second one") route to the AI chat with the summary in history.
      lastWasAppRef.current = true;
      const thread = [...historyRef.current.slice(-8), { role: "user" as const, content: transcript }];
      let cancelled = false;
      setIsThinking(true);
      (async () => {
        try {
          const result = await fetchDeals(transcript, buildAiContext(settings, weatherData));
          if (cancelled) return;
          if (result.ok) {
            const summary =
              result.summary ||
              (result.deals.length > 0
                ? "Here's what I found."
                : "I couldn't find live deals for that right now.");
            historyRef.current = [...thread, { role: "assistant" as const, content: summary }].slice(-20);
            setDealResults(result.deals.length > 0 ? result.deals : null);
            setAnswer(summary);
            speak(summary, settings.voiceName);
          } else if (result.error === "pro_required") {
            const msg = "Deal hunting is a Pro feature. Upgrade on the Pro tab to search live clothing deals.";
            historyRef.current = [...thread, { role: "assistant" as const, content: msg }].slice(-20);
            setDealResults(null);
            setAnswer(msg);
            speak(msg, settings.voiceName);
          } else if (result.error === "daily_limit") {
            const msg = result.detail ?? "You've hit today's deal search limit — it resets tomorrow.";
            historyRef.current = [...thread, { role: "assistant" as const, content: msg }].slice(-20);
            setDealResults(null);
            setAnswer(msg);
            speak(msg, settings.voiceName);
          } else {
            throw new Error("failed");
          }
        } catch {
          if (cancelled) return;
          setError("Deal search isn't working right now. Try again in a bit.");
        } finally {
          if (!cancelled) setIsThinking(false);
        }
      })();
      return () => {
        cancelled = true;
      };
    }

    if (intent.type === "app") {
      // Questions about the app and its contents (closet, wardrobe, saved
      // fits) go to the AI backend, which has the full closet, weather, and
      // style context in its prompt — the local answer builder can't see it.
      // Recent turns travel along so follow-ups resolve against the thread.
      lastWasAppRef.current = true;
      const thread = [...historyRef.current.slice(-8), { role: "user" as const, content: transcript }];
      let cancelled = false;
      setIsThinking(true);
      (async () => {
        try {
          const res = await fetch("/api/ai/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              messages: thread,
              context: buildAiContext(settings, weatherData),
            }),
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data = await res.json();
          const reply = String(data.reply ?? "").trim();
          if (!reply) throw new Error("empty");
          if (cancelled) return;
          historyRef.current = [...thread, { role: "assistant" as const, content: reply }].slice(-20);
          setDealResults(null);
          setAnswer(reply);
          speak(reply, settings.voiceName);
        } catch {
          if (cancelled) return;
          setError("Couldn't reach the assistant. Check your connection and try again.");
        } finally {
          if (!cancelled) setIsThinking(false);
        }
      })();
      return () => {
        cancelled = true;
      };
    }

    lastWasAppRef.current = false;
    if (weatherData && recommendation) {
      const ans = buildVoiceAnswer(intent, weatherData, recommendation, settings);
      setAnswer(ans);
      speak(ans, settings.voiceName);
    }
    return undefined;
  }, [isOpen, isListening, transcript, isSpeaking, answer, weatherData, recommendation, settings, speak, setError]);

  // Auto-retry when nothing was heard
  const handleRetry = () => {
    setAnswer(null);
    setDealResults(null);
    setIsThinking(false);
    startListening();
  };

  // Reply in the same session: clear the shown answer and listen again,
  // keeping the conversation history so follow-ups make sense.
  const handleReply = () => {
    setError(null);
    setAnswer(null);
    setDealResults(null);
    setIsThinking(false);
    startListening();
  };

  // When the assistant's reply ends with a question, reopen the mic
  // automatically so Joshua can answer it in the same session.
  useEffect(() => {
    if (!isOpen || !answer || isSpeaking || isListening || error || autoFollowedUpRef.current) return;
    if (!/\?\s*["']?$/.test(answer)) return;
    autoFollowedUpRef.current = true;
    // Brief pause so the mic doesn't catch the speaker's tail.
    const t = setTimeout(() => {
      handleReply();
    }, 800);
    return () => clearTimeout(t);
  }, [isOpen, answer, isSpeaking, isListening, error, startListening]);

  useEffect(() => {
    // Idle auto-close: only when the answer is sitting there with the mic
    // and speaker both quiet. Never close mid-listen or mid-speech.
    if (isOpen && answer && !isSpeaking && !isListening) {
      answerTimeoutRef.current = setTimeout(() => {
        handleClose();
      }, 20000);
    }
    return () => {
      if (answerTimeoutRef.current) clearTimeout(answerTimeoutRef.current);
    };
  }, [isOpen, answer, isSpeaking, isListening]);

  const handleOpen = () => {
    if (!isSupported) {
      toast({
        title: "Voice not supported",
        description: "Try using Safari or Chrome to use the voice assistant.",
      });
      return;
    }
    resetConversation();
    setIsOpen(true);
    setAnswer(null);
    setDealResults(null);
    setIsThinking(false);
    startListening();
  };

  const handleClose = () => {
    stopListening();
    cancelSpeech();
    resetConversation();
    setIsOpen(false);
    setAnswer(null);
    setDealResults(null);
    setIsThinking(false);
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
            className="fixed inset-0 z-50 flex flex-col items-center justify-center p-6"
            style={{ backgroundColor: 'rgba(250, 247, 244, 0.97)' }}
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
                  <>
                    <motion.p
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-2xl font-display font-medium text-foreground leading-tight"
                    >
                      {answer}
                    </motion.p>
                    {dealResults && dealResults.length > 0 && (
                      <div
                        className="max-h-64 overflow-y-auto w-full text-left"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <DealResults deals={dealResults} />
                      </div>
                    )}
                  </>
                ) : error ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center gap-4"
                  >
                    <p className="text-xl font-display font-medium text-muted-foreground">
                      {error}
                    </p>
                    <button
                      onClick={handleRetry}
                      className="px-8 py-3 rounded-full bg-primary text-primary-foreground font-semibold"
                    >
                      Try again
                    </button>
                  </motion.div>
                ) : (
                  <>
                    <p className="text-3xl font-display font-bold text-foreground min-h-[80px]">
                      {isThinking ? "Thinking..." : (transcript || (isListening ? "Listening..." : "Processing..."))}
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
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-3"
                >
                  <button
                    onClick={handleReply}
                    className="px-8 py-3 rounded-full bg-primary text-primary-foreground font-semibold flex items-center gap-2 hover:bg-primary/90 transition-colors"
                  >
                    <Mic className="w-5 h-5" />
                    Reply
                  </button>
                  <button
                    onClick={handleClose}
                    className="px-8 py-3 rounded-full bg-foreground text-background font-semibold hover:bg-foreground/90 transition-colors"
                  >
                    Done
                  </button>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
