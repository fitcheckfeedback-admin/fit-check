import { Router } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";

const router = Router();

interface ClosetItemInfo {
  name: string;
  category: string;
}

interface StylistRequest {
  weather: {
    tempF: number;
    feelsLikeF: number;
    condition: string;
    windMph: number;
    precipChance: number;
    isDay: boolean;
  };
  closetItems: ClosetItemInfo[];
  style: string;
}

router.post("/ai/stylist", async (req, res) => {
  try {
    const { weather, closetItems, style } = req.body as StylistRequest;

    if (!weather || !closetItems || !style) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const itemsByCategory: Record<string, string[]> = {};
    for (const item of closetItems) {
      if (!itemsByCategory[item.category]) itemsByCategory[item.category] = [];
      itemsByCategory[item.category].push(item.name);
    }

    const closetSummary = Object.entries(itemsByCategory)
      .map(([cat, items]) => `${cat}: ${items.join(", ")}`)
      .join("\n");

    const hasItems = closetItems.length > 0;

    const prompt = hasItems
      ? `You are a personal stylist AI. Based on the weather and the user's actual closet, recommend a specific outfit by naming exact items from their wardrobe.

WEATHER CONDITIONS:
- Temperature: ${Math.round(weather.tempF)}°F (feels like ${Math.round(weather.feelsLikeF)}°F)
- Condition: ${weather.condition}
- Wind: ${Math.round(weather.windMph)} mph
- Precipitation chance: ${weather.precipChance}%
- Time of day: ${weather.isDay ? "daytime" : "nighttime"}

USER'S CLOSET:
${closetSummary}

USER'S STYLE PREFERENCE: ${style}

Give a specific outfit recommendation using ONLY items from their closet above. Be concise and direct. Format:
- Main outfit: [specific items by name]
- Outerwear: [specific item or "none needed"]
- Footwear: [specific item]
- Accessories: [specific items or "none"]
- Stylist note: [one sentence of style advice]`
      : `You are a personal stylist AI. The user's closet is empty, but based on their weather and style, give general outfit advice.

WEATHER: ${Math.round(weather.tempF)}°F, ${weather.condition}, ${weather.precipChance}% rain chance
STYLE: ${style}

Give a brief, specific outfit suggestion in 2-3 sentences.`;

    const response = await openai.chat.completions.create({
      model: "gpt-5.1",
      max_completion_tokens: 512,
      messages: [{ role: "user", content: prompt }],
    });

    const content = response.choices[0]?.message?.content ?? "";
    res.json({ recommendation: content });
  } catch (err) {
    console.error("AI stylist error:", err);
    res.status(500).json({ error: "AI stylist failed" });
  }
});

export default router;
