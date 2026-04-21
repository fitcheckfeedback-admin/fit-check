import { Router, type IRouter } from "express";
import OpenAI from "openai";

const router: IRouter = Router();

const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
});

const ALLOWED_VOICES = new Set([
  "alloy", "ash", "ballad", "coral", "echo", "fable",
  "nova", "onyx", "sage", "shimmer", "verse",
]);

router.post("/tts", async (req, res) => {
  try {
    const { text, voice } = req.body ?? {};

    if (typeof text !== "string" || !text.trim()) {
      res.status(400).json({ error: "text is required" });
      return;
    }
    if (text.length > 2000) {
      res.status(400).json({ error: "text too long (max 2000 chars)" });
      return;
    }

    const chosenVoice = typeof voice === "string" && ALLOWED_VOICES.has(voice)
      ? voice
      : "nova";

    const speech = await openai.audio.speech.create({
      model: "tts-1",
      voice: chosenVoice as any,
      input: text,
      response_format: "mp3",
    });

    const buffer = Buffer.from(await speech.arrayBuffer());

    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Content-Length", buffer.length.toString());
    res.send(buffer);
  } catch (err: any) {
    const detail = err?.response?.data ?? err?.message ?? String(err);
    console.error("TTS error:", detail);
    res.status(500).json({ error: "Failed to synthesize speech", detail: String(detail) });
  }
});

export default router;
