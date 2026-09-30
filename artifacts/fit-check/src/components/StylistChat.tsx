import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Loader2, Volume2, Square, Sparkles, ImagePlus } from "lucide-react";
import { compressImage } from "@/lib/imageCompress";
import { speak, stopSpeaking } from "@/lib/tts";

export interface ChatWeather {
  tempF: number;
  feelsLikeF: number;
  condition: string;
  windMph: number;
  precipChance: number;
  isDay: boolean;
}

interface StylistChatProps {
  open: boolean;
  onClose: () => void;
  weather: ChatWeather;
  closetItems: { name: string; category: string }[];
  style: string;
  gender?: string;
  pastOutfits?: string[];
}

interface ChatMsg {
  id: string;
  role: "user" | "assistant";
  content: string;
  image?: string;
}

const THREAD_KEY = "fitcheck-stylist-thread";
const MAX_STORED = 40;

const QUICK_PROMPTS = [
  { label: "☀️ Morning briefing", text: "Give me my morning briefing: today's weather and my outfit." },
  { label: "🧳 Trip packing", text: "Help me plan a packing list for a trip." },
  { label: "👔 Closet gaps", text: "What gaps do you see in my closet? What should I shop for next?" },
  { label: "✨ Surprise me", text: "Suggest an outfit for today that pushes my style a little." },
];

function loadThread(): ChatMsg[] {
  try {
    const raw = localStorage.getItem(THREAD_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(-MAX_STORED) : [];
  } catch {
    return [];
  }
}

export function StylistChat({ open, onClose, weather, closetItems, style, gender, pastOutfits }: StylistChatProps) {
  const [messages, setMessages] = useState<ChatMsg[]>(() => loadThread());
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      localStorage.setItem(THREAD_KEY, JSON.stringify(messages.slice(-MAX_STORED)));
    } catch { /* ignore */ }
  }, [messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  useEffect(() => {
    if (!open) stopSpeaking();
  }, [open ]);

  async function send(text: string, image?: string | null) {
    const content = text.trim();
    if ((!content && !image) || sending) return;
    setError(null);
    const userMsg: ChatMsg = {
      id: `u-${Date.now()}`,
      role: "user",
      content: content || (image ? "Rate my fit." : ""),
      ...(image ? { image } : {}),
    };
    const history = [...messages, userMsg].slice(-MAX_STORED);
    setMessages(history);
    setInput("");
    setPendingImage(null);
    setSending(true);
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history.slice(-20).map((m) => ({
            role: m.role,
            content: m.content,
            ...(m.image ? { image: m.image } : {}),
          })),
          context: { weather, closetItems, style, gender, pastOutfits },
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const reply = String(data.reply ?? "").trim();
      if (!reply) throw new Error("empty");
      setMessages((prev) => [...prev, { id: `a-${Date.now()}`, role: "assistant" as const, content: reply }].slice(-MAX_STORED));
    } catch {
      setError("Couldn't reach the stylist. Check your connection and try again.");
    } finally {
      setSending(false);
    }
  }

  async function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (fileRef.current) fileRef.current.value = "";
    if (!file) return;
    try {
      const blob = await compressImage(file, 1024, 0.8);
      const reader = new FileReader();
      reader.onload = () => {
        const url = String(reader.result ?? "");
        if (url.startsWith("data:image/")) {
          setPendingImage(url);
        }
      };
      reader.readAsDataURL(blob);
    } catch {
      setError("Couldn't process that photo.");
    }
  }

  async function toggleSpeak(msg: ChatMsg) {
    if (speakingId === msg.id) {
      await stopSpeaking();
      setSpeakingId(null);
      return;
    }
    await stopSpeaking();
    setSpeakingId(msg.id);
    try {
      await speak(msg.content, { onEnd: () => setSpeakingId((id) => (id === msg.id ? null : id)) });
    } finally {
      setSpeakingId((id) => (id === msg.id ? null : id));
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex flex-col bg-black/60"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="mt-auto flex flex-col h-[88dvh] rounded-t-3xl overflow-hidden bg-white dark:bg-neutral-900"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 shrink-0" style={{ background: "linear-gradient(135deg, #FF9500 0%, #FF6B00 100%)" }}>
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-white" />
                <div>
                  <h2 className="text-white font-bold text-base leading-tight">AI Stylist</h2>
                  <p className="text-white/70 text-xs">Outfits, fit checks, packing & more</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 rounded-full bg-white/20 text-white" aria-label="Close chat">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {messages.length === 0 && (
                <div className="text-center pt-8 px-6">
                  <Sparkles className="w-10 h-10 mx-auto text-orange-400 mb-3" />
                  <p className="font-semibold text-neutral-800 dark:text-neutral-100 mb-1">Your personal stylist is in.</p>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    Ask for today's outfit, snap a photo for a fit check, or plan a whole trip.
                  </p>
                </div>
              )}
              {messages.map((m) => (
                <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[82%] rounded-2xl px-4 py-2.5 text-[15px] leading-snug ${
                      m.role === "user"
                        ? "bg-orange-500 text-white rounded-br-md"
                        : "bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-bl-md"
                    }`}
                  >
                    {m.image && (
                      <img src={m.image} alt="Outfit" className="rounded-xl mb-2 max-h-48 w-full object-cover" />
                    )}
                    <p className="whitespace-pre-wrap">{m.content}</p>
                    {m.role === "assistant" && (
                      <button
                        onClick={() => toggleSpeak(m)}
                        className="mt-1.5 flex items-center gap-1 text-xs font-semibold text-orange-600 dark:text-orange-400"
                        aria-label={speakingId === m.id ? "Stop reading" : "Read aloud"}
                      >
                        {speakingId === m.id ? <Square className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                        {speakingId === m.id ? "Stop" : "Listen"}
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {sending && (
                <div className="flex justify-start">
                  <div className="bg-neutral-100 dark:bg-neutral-800 rounded-2xl rounded-bl-md px-4 py-3">
                    <Loader2 className="w-5 h-5 animate-spin text-orange-500" />
                  </div>
                </div>
              )}
              {error && <p className="text-center text-sm text-red-500">{error}</p>}
              <div ref={bottomRef} />
            </div>

            {/* Quick prompts */}
            <div className="shrink-0 px-4 pb-2 flex gap-2 overflow-x-auto">
              {QUICK_PROMPTS.map((q) => (
                <button
                  key={q.label}
                  onClick={() => send(q.text)}
                  disabled={sending}
                  className="shrink-0 text-xs font-semibold px-3 py-2 rounded-full border border-orange-300 text-orange-600 dark:text-orange-400 disabled:opacity-50"
                >
                  {q.label}
                </button>
              ))}
            </div>

            {/* Pending photo */}
            {pendingImage && (
              <div className="shrink-0 px-4 pb-2">
                <div className="relative inline-block">
                  <img src={pendingImage} alt="Attach" className="h-20 w-20 object-cover rounded-xl" />
                  <button
                    onClick={() => setPendingImage(null)}
                    className="absolute -top-2 -right-2 bg-neutral-800 text-white rounded-full p-1"
                    aria-label="Remove photo"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Input */}
            <div className="shrink-0 px-4 pb-5 pt-1 flex items-center gap-2 border-t border-neutral-100 dark:border-neutral-800">
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
              <button
                onClick={() => fileRef.current?.click()}
                className="p-2.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300"
                aria-label="Attach a photo"
              >
                <ImagePlus className="w-5 h-5" />
              </button>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send(input, pendingImage)}
                placeholder="Ask your stylist…"
                className="flex-1 h-11 px-4 rounded-full bg-neutral-100 dark:bg-neutral-800 text-[15px] outline-none placeholder:text-neutral-400"
              />
              <button
                onClick={() => send(input, pendingImage)}
                disabled={sending || (!input.trim() && !pendingImage)}
                className="p-2.5 rounded-full text-white disabled:opacity-40"
                style={{ background: "linear-gradient(135deg, #FF9500 0%, #FF6B00 100%)" }}
                aria-label="Send"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
