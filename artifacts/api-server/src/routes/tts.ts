import { Router } from "express";
import { createHash } from "node:crypto";
import { openai } from "@workspace/integrations-openai-ai-server";

const router = Router();

// gpt-4o-mini-tts is the low-cost, low-latency speech model.
// Voices: alloy, ash, ballad, coral, echo, fable, nova, onyx, sage, shimmer, verse.
const TTS_MODEL = process.env.TTS_MODEL ?? "gpt-4o-mini-tts";
const TTS_VOICE = process.env.TTS_VOICE ?? "nova";
const MAX_CHARS = 2000;

interface TtsRequest {
  text: string;
  voice?: string;
}

// Small in-memory LRU: assistant replies repeat constantly
// ("Today looks like a great day to layer up", etc.), so cache by
// hash of model+voice+text and serve bytes without hitting OpenAI.
const MAX_CACHE_ENTRIES = 300;
const cache = new Map<string, Buffer>();

function cacheKey(model: string, voice: string, text: string): string {
  return createHash("sha256").update(`${model}|${voice}|${text}`).digest("hex");
}

function cacheGet(key: string): Buffer | undefined {
  const hit = cache.get(key);
  if (hit) {
    // refresh LRU position
    cache.delete(key);
    cache.set(key, hit);
  }
  return hit;
}

function cacheSet(key: string, audio: Buffer): void {
  if (cache.has(key)) cache.delete(key);
  cache.set(key, audio);
  while (cache.size > MAX_CACHE_ENTRIES) {
    const oldest = cache.keys().next();
    if (oldest.done) break;
    cache.delete(oldest.value);
  }
}

router.post("/tts", async (req, res) => {
  try {
    const { text, voice } = req.body as TtsRequest;

    if (typeof text !== "string" || text.trim().length === 0) {
      return res.status(400).json({ error: "Missing required field: text" });
    }
    if (text.length > MAX_CHARS) {
      return res.status(400).json({ error: `text too long (max ${MAX_CHARS} chars)` });
    }

    const cleanText = text.trim();
    const useVoice = typeof voice === "string" && voice.length > 0 ? voice : TTS_VOICE;
    const key = cacheKey(TTS_MODEL, useVoice, cleanText);

    const cached = cacheGet(key);
    if (cached) {
      res.setHeader("Content-Type", "audio/mpeg");
      res.setHeader("X-Cache", "HIT");
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      return res.send(cached);
    }

    const speech = await openai.audio.speech.create({
      model: TTS_MODEL,
      voice: useVoice as "nova",
      input: cleanText,
      response_format: "mp3",
    });

    const audio = Buffer.from(await speech.arrayBuffer());
    if (audio.length === 0) {
      return res.status(502).json({ error: "TTS provider returned empty audio" });
    }

    cacheSet(key, audio);

    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("X-Cache", "MISS");
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    return res.send(audio);
  } catch (err) {
    console.error("[/api/tts]", err);
    return res.status(502).json({ error: "Speech synthesis failed" });
  }
});

export default router;
