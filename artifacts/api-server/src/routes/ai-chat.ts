import { Router } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";

const router = Router();

const MAX_MESSAGES = 20;
const MAX_TEXT_LEN = 2000;
const MAX_IMAGE_LEN = 7_000_000; // ~5MB base64

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  /** Optional data-URL photo attached to a user message (for "rate my fit"). */
  image?: string;
}

interface ChatContext {
  weather?: {
    tempF: number;
    feelsLikeF: number;
    condition: string;
    windMph: number;
    precipChance: number;
    isDay: boolean;
  };
  closetItems?: { name: string; category: string }[];
  style?: string;
  gender?: string;
  /** Short summaries of recently worn/saved outfits, for continuity. */
  pastOutfits?: string[];
}

interface ChatRequest {
  messages: ChatMessage[];
  context?: ChatContext;
}

function genderLabel(gender?: string): string {
  if (gender === "female") return "women's";
  if (gender === "male") return "men's";
  return "gender-neutral";
}

function buildSystemPrompt(ctx: ChatContext): string {
  const w = ctx.weather;
  const weatherLine = w
    ? `Today's weather: ${Math.round(w.tempF)}°F (feels like ${Math.round(w.feelsLikeF)}°F), ${w.condition}, wind ${Math.round(w.windMph)} mph, ${w.precipChance}% chance of rain, ${w.isDay ? "daytime" : "nighttime"}.`
    : "Weather unknown.";

  const items = ctx.closetItems ?? [];
  const closetLine =
    items.length > 0
      ? `The user's closet (${items.length} items):\n${items.map((i) => `- ${i.name} (${i.category})`).join("\n")}`
      : "The user's closet is empty.";

  const pastLine =
    ctx.pastOutfits && ctx.pastOutfits.length > 0
      ? `Recently worn outfits:\n${ctx.pastOutfits.map((o) => `- ${o}`).join("\n")}`
      : "";

  return `You are the FIT Check AI stylist — a warm, sharp personal stylist who talks like a stylish friend, not a catalog. ${weatherLine}

${closetLine}

Style preference: ${ctx.style || "not specified"}. Wardrobe: ${genderLabel(ctx.gender)}.

${pastLine}

What you can do in this chat:
- Recommend specific outfits, naming EXACT items from the closet above. Never claim the user owns something not listed.
- RATE MY FIT: when the user attaches a photo of their outfit, score it /10 and give 2-3 concrete tweaks.
- Trip packing: build day-by-day packing lists from the closet for the days they name.
- Closet gaps: point out missing essentials and what to shop for next.
- Occasion advice: date night, interview, wedding — dress the part from what they own.
- Morning briefing: weather + today's outfit in a few punchy lines.
- Follow-ups: refine ("dressier", "it's raining now") using the conversation history.

Style rules:
- Keep it conversational and concise: 2-5 sentences for chat, short lists only when asked for a plan or list.
- One question at a time when you need info (occasion, trip length, dress code).
- If the closet is empty, give general advice and nudge them to add items.
- Never be preachy. No disclaimers. Just style.`;
}

router.post("/ai/chat", async (req, res) => {
  try {
    const { messages, context = {} } = req.body as ChatRequest;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "messages is required" });
    }

    const trimmed = messages.slice(-MAX_MESSAGES);
    const openaiMessages: any[] = [{ role: "system", content: buildSystemPrompt(context) }];

    for (const m of trimmed) {
      if (m.role !== "user" && m.role !== "assistant") continue;
      const text = String(m.content ?? "").slice(0, MAX_TEXT_LEN);
      if (m.role === "user" && m.image && typeof m.image === "string") {
        const img = m.image.slice(0, MAX_IMAGE_LEN);
        if (!img.startsWith("data:image/")) continue;
        openaiMessages.push({
          role: "user",
          content: [
            { type: "text", text: text || "Rate my fit." },
            { type: "image_url", image_url: { url: img, detail: "low" } },
          ],
        });
      } else {
        if (!text.trim()) continue;
        openaiMessages.push({ role: m.role, content: text });
      }
    }

    // Need at least one user message after the system prompt.
    if (openaiMessages.length < 2) {
      return res.status(400).json({ error: "No valid messages" });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      max_completion_tokens: 600,
      messages: openaiMessages,
    });

    const reply = response.choices[0]?.message?.content?.trim() ?? "";
    if (!reply) {
      return res.status(502).json({ error: "Empty response from stylist" });
    }
    return res.json({ reply });
  } catch (err) {
    console.error("AI chat error:", err);
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("AI_INTEGRATIONS_OPENAI_API_KEY")) {
      return res.status(503).json({ error: "AI stylist is not configured yet" });
    }
    return res.status(500).json({ error: "AI stylist failed" });
  }
});

export default router;
