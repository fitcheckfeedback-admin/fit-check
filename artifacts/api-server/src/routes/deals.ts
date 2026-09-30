import { Router } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";
import { db, sponsoredProductsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { checkPro } from "../lib/proAuth";
import { logger } from "../lib/logger";

const router = Router();

const DAILY_LIMIT = Math.max(1, Number(process.env.DEAL_DAILY_LIMIT ?? 5) || 5);
const MAX_QUERY_LEN = 300;
const MAX_DEALS = 6;

/** Map free-text words to closet categories for sponsored matching. */
const CATEGORY_WORDS: Record<string, string[]> = {
  tops: ["shirt", "tee", "t-shirt", "blouse", "top", "sweater", "hoodie", "henley", "polo", "tank"],
  bottoms: ["jean", "pant", "trouser", "chino", "short", "skirt", "jogger", "slack"],
  outerwear: ["jacket", "coat", "blazer", "vest", "parka", "windbreaker", "cardigan"],
  shoes: ["shoe", "sneaker", "boot", "sandal", "loafer", "heel", "trainer"],
  accessories: ["hat", "belt", "scarf", "glove", "watch", "tie", "beanie", "sock", "bag"],
};

export interface Deal {
  /** Present for sponsored deals (used for click tracking). */
  id?: string;
  name: string;
  brand?: string;
  price?: string;
  url: string;
  retailer?: string;
  why?: string;
  sponsored?: boolean;
}

interface DealContext {
  closetItems?: { name: string; category: string }[];
  style?: string;
  gender?: string;
}

function genderLabel(gender?: string): string {
  if (gender === "female") return "women's";
  if (gender === "male") return "men's";
  return "gender-neutral";
}

function wardrobeGaps(ctx: DealContext): string[] {
  const cats = ["tops", "bottoms", "outerwear", "shoes", "accessories"];
  const items = Array.isArray(ctx.closetItems) ? ctx.closetItems : [];
  const counts = new Map<string, number>();
  for (const i of items) {
    if (i && typeof i.category === "string") {
      counts.set(i.category, (counts.get(i.category) ?? 0) + 1);
    }
  }
  return cats.filter((c) => (counts.get(c) ?? 0) === 0);
}

function buildPrompt(query: string, ctx: DealContext): string {
  const items = (Array.isArray(ctx.closetItems) ? ctx.closetItems : []).filter(
    (i) => i && typeof i.name === "string"
  );
  const closetLine =
    items.length > 0
      ? `Their closet (${items.length} items): ${items.slice(0, 60).map((i) => `${i.name} (${i.category})`).join("; ")}.`
      : "Their closet is empty.";
  const gaps = wardrobeGaps(ctx);
  return `You are the FIT Check deal hunter — a sharp personal stylist who finds real clothing deals online.

Find CURRENT deals for: "${query}"

User profile: ${ctx.style || "unspecified"} style, ${genderLabel(ctx.gender)} wardrobe.
${closetLine}
${gaps.length > 0 ? `Wardrobe gaps to prioritize: ${gaps.join(", ")}.` : ""}

Rules:
- Use web search to find real, currently-listed products with actual prices.
- Prefer major retailers with clear pricing (Nordstrom, Gap, Old Navy, H&M, Zara, Amazon, Target, Macy's, etc.).
- Match the user's style and prioritize filling their wardrobe gaps.
- Return ONLY valid JSON, no markdown fences, no commentary: {"summary": "1-2 sentence conversational summary of what you found", "deals": [{"name": "product name", "brand": "brand", "price": "$..", "url": "https://...", "retailer": "store name", "why": "one short line on why it fits"}]}
- Up to ${MAX_DEALS} deals. Every deal MUST include a real URL you found via search. Never invent or guess URLs.`;
}

/** Pull assistant text out of a Responses API result, defensively. */
function extractOutputText(resp: any): string {
  if (typeof resp?.output_text === "string" && resp.output_text.trim()) {
    return resp.output_text;
  }
  const out = resp?.output;
  if (Array.isArray(out)) {
    const parts: string[] = [];
    for (const item of out) {
      if (item?.type === "message" && Array.isArray(item.content)) {
        for (const c of item.content) {
          if ((c?.type === "output_text" || c?.type === "text") && typeof c.text === "string") {
            parts.push(c.text);
          }
        }
      }
    }
    if (parts.length > 0) return parts.join("\n");
  }
  return "";
}

function isValidDeal(d: any): boolean {
  return (
    !!d &&
    typeof d.name === "string" &&
    d.name.trim().length > 0 &&
    typeof d.url === "string" &&
    /^https:\/\//i.test(d.url.trim())
  );
}

function normalizeDeal(d: any): Deal {
  const str = (v: any) => (typeof v === "string" ? v.slice(0, 300).trim() : undefined);
  return {
    name: String(d.name).slice(0, 200).trim(),
    brand: str(d.brand),
    price: str(d.price),
    url: d.url.trim(),
    retailer: str(d.retailer),
    why: str(d.why)?.slice(0, 300),
  };
}

function parseDealResponse(text: string): { summary: string; deals: Deal[] } {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end <= start) {
    return { summary: text.slice(0, 500), deals: [] };
  }
  try {
    const obj = JSON.parse(text.slice(start, end + 1));
    const deals = Array.isArray(obj.deals)
      ? obj.deals.filter(isValidDeal).map(normalizeDeal).slice(0, MAX_DEALS)
      : [];
    const summary =
      typeof obj.summary === "string" && obj.summary.trim()
        ? obj.summary.slice(0, 600)
        : text.slice(0, 300);
    return { summary, deals };
  } catch {
    return { summary: text.slice(0, 500), deals: [] };
  }
}

function getAffiliateTags(): Record<string, string> {
  try {
    const o = JSON.parse(process.env.AFFILIATE_TAGS ?? "{}");
    return o && typeof o === "object" ? (o as Record<string, string>) : {};
  } catch {
    return {};
  }
}

/** Append Joshua's affiliate tag (e.g. "tag=fitcheck-20") to matching retailer URLs. */
function applyAffiliateTags(url: string, tags: Record<string, string>): string {
  const entries = Object.entries(tags);
  if (entries.length === 0) return url;
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "").toLowerCase();
    for (const [domain, tag] of entries) {
      const d = String(domain).toLowerCase();
      if (host === d || host.endsWith(`.${d}`)) {
        const eqIdx = String(tag).indexOf("=");
        if (eqIdx > 0) {
          const k = String(tag).slice(0, eqIdx);
          const v = String(tag).slice(eqIdx + 1);
          if (k && v && !u.searchParams.has(k)) u.searchParams.set(k, v);
        }
        break;
      }
    }
    return u.toString();
  } catch {
    return url;
  }
}

/** Find sponsored products relevant to the query; returns at most 2. */
async function findSponsored(query: string): Promise<Deal[]> {
  let products;
  try {
    products = await db
      .select()
      .from(sponsoredProductsTable)
      .where(eq(sponsoredProductsTable.isActive, true));
  } catch (err) {
    logger.warn({ err }, "sponsored lookup failed");
    return [];
  }
  if (products.length === 0) return [];

  const q = query.toLowerCase();
  const queryCats = new Set<string>();
  for (const [cat, words] of Object.entries(CATEGORY_WORDS)) {
    if (words.some((w) => q.includes(w))) queryCats.add(cat);
  }

  const scored = products
    .map((p) => {
      const hay = `${p.brand} ${p.name} ${p.category}`.toLowerCase();
      let score = 0;
      if (queryCats.has(p.category.toLowerCase())) score += 2;
      for (const tok of q.split(/[^a-z0-9]+/).filter((t) => t.length > 2)) {
        if (hay.includes(tok)) score += 1;
      }
      return { p, score };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.p.priority - a.p.priority || b.score - a.score)
    .slice(0, 2);

  return scored.map(({ p }) => ({
    id: p.id,
    name: p.name,
    brand: p.brand,
    price: p.price ?? undefined,
    url: p.url,
    retailer: p.brand,
    why: "Featured partner pick",
    sponsored: true,
  }));
}

async function checkRateLimit(usageKey: string): Promise<{ ok: boolean; count: number }> {
  try {
    const result: any = await db.execute(sql`
      INSERT INTO deal_search_usage (device_id, day, count)
      VALUES (${usageKey}, CURRENT_DATE, 1)
      ON CONFLICT (device_id, day)
      DO UPDATE SET count = deal_search_usage.count + 1
      RETURNING count
    `);
    const row = result?.rows?.[0] ?? result?.[0];
    const count = Number(row?.count ?? 1);
    return { ok: count <= DAILY_LIMIT, count };
  } catch (err) {
    // If usage tracking itself breaks, fail closed — don't burn AI spend blind.
    logger.error({ err }, "deal usage tracking failed");
    return { ok: false, count: DAILY_LIMIT + 1 };
  }
}

router.post("/ai/deals", async (req, res) => {
  try {
    const { deviceId, rcUserId, query, context = {} } = req.body ?? {};

    const q = typeof query === "string" ? query.trim().slice(0, MAX_QUERY_LEN) : "";
    if (!q) {
      return res.status(400).json({ error: "query is required" });
    }
    const cleanDevice = typeof deviceId === "string" && deviceId.trim() ? deviceId.trim() : null;
    const cleanRc = typeof rcUserId === "string" && rcUserId.trim() ? rcUserId.trim() : null;
    if (!cleanDevice && !cleanRc) {
      return res.status(400).json({ error: "deviceId or rcUserId is required" });
    }

    const { pro } = await checkPro(cleanDevice, cleanRc);
    if (!pro) {
      return res.status(403).json({ error: "pro_required" });
    }

    const usageKey = cleanDevice ?? `rc:${cleanRc}`;
    const { ok, count } = await checkRateLimit(usageKey);
    if (!ok) {
      return res.status(429).json({ error: "daily_limit", detail: `Deal searches reset tomorrow (${DAILY_LIMIT}/day on Pro).` });
    }
    logger.info({ usageKey, count }, "deal search");

    const ctx = context as DealContext;
    let text: string;
    try {
      const response: any = await openai.responses.create({
        model: "gpt-4o",
        tools: [{ type: "web_search" }],
        input: buildPrompt(q, ctx),
        max_output_tokens: 900,
      });
      text = extractOutputText(response);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.error({ err }, "deal web search failed");
      if (/AI_INTEGRATIONS_OPENAI_API_KEY/.test(msg)) {
        return res.status(503).json({ error: "ai_not_configured" });
      }
      if (/404|not found|unknown tool|web_search|responses/i.test(msg)) {
        return res.status(502).json({ error: "web_search_unavailable" });
      }
      return res.status(502).json({ error: "deal_search_failed" });
    }

    if (!text.trim()) {
      return res.status(502).json({ error: "deal_search_failed" });
    }

    const { summary, deals } = parseDealResponse(text);
    const tags = getAffiliateTags();
    const tagged = deals.map((d) => ({ ...d, url: applyAffiliateTags(d.url, tags) }));
    const sponsored = await findSponsored(q);
    const sponsoredTagged = sponsored.map((d) => ({ ...d, url: applyAffiliateTags(d.url, tags) }));

    return res.json({ summary, deals: [...sponsoredTagged, ...tagged] });
  } catch (err) {
    logger.error({ err }, "deals route failed");
    return res.status(500).json({ error: "deal_search_failed" });
  }
});

export default router;
