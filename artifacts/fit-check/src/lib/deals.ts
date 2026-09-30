import { Browser } from "@capacitor/browser";
import { isNative } from "./platform";
import { getOrCreateDeviceId } from "./deviceId";
import { getRCUserId } from "./revenuecat";
import type { AiChatContext } from "./appContext";

export interface Deal {
  id?: string;
  name: string;
  brand?: string;
  price?: string;
  url: string;
  retailer?: string;
  why?: string;
  sponsored?: boolean;
}

export interface SponsoredProduct {
  id: string;
  brand: string;
  name: string;
  price: string | null;
  category: string;
  imageUrl: string | null;
  url: string;
}

/** Phrases that mean "search the web for clothing deals or product links".
 *  Shared by the voice assistant and stylist chat so shopping asks always
 *  route to the live deal search — the plain chat model has no web access
 *  and cannot return real links. */
export const DEAL_RE =
  /\bdeals?\b|\bsale\b|\bdiscount\b|\bcheapest\b|\bcoupon\b|where can i buy|find me.*(cheap|deal)|\blinks?\b|\bshop\b|\bbuy\b|where (can|do) i (get|find|buy)/i;

export type DealsResult =
  | { ok: true; summary: string; deals: Deal[] }
  | { ok: false; error: "pro_required" | "daily_limit" | "failed"; detail?: string };

function cleanDeal(d: any): Deal | null {
  if (!d || typeof d.name !== "string" || typeof d.url !== "string") return null;
  if (!/^https:\/\//i.test(d.url.trim())) return null;
  const str = (v: any) => (typeof v === "string" && v.trim() ? v.trim().slice(0, 300) : undefined);
  return {
    id: str(d.id),
    name: d.name.trim().slice(0, 200),
    brand: str(d.brand),
    price: str(d.price),
    url: d.url.trim(),
    retailer: str(d.retailer),
    why: str(d.why),
    sponsored: d.sponsored === true,
  };
}

/** Pro-only: web deal search matched to the user's wardrobe. */
export async function fetchDeals(query: string, context: AiChatContext): Promise<DealsResult> {
  try {
    const deviceId = getOrCreateDeviceId();
    const rcUserId = await getRCUserId();
    const res = await fetch("/api/ai/deals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deviceId, rcUserId, query, context }),
    });
    if (res.status === 403) return { ok: false, error: "pro_required" };
    if (res.status === 429) {
      let detail: string | undefined;
      try {
        detail = String((await res.json()).detail ?? "");
      } catch {
        /* ignore */
      }
      return { ok: false, error: "daily_limit", detail: detail || undefined };
    }
    if (!res.ok) return { ok: false, error: "failed" };
    const data = await res.json();
    const deals = Array.isArray(data.deals)
      ? data.deals.map(cleanDeal).filter((d: Deal | null): d is Deal => !!d)
      : [];
    return { ok: true, summary: String(data.summary ?? "").slice(0, 600), deals };
  } catch {
    return { ok: false, error: "failed" };
  }
}

/** Public feed of paid brand placements. */
export async function fetchSponsored(category?: string): Promise<SponsoredProduct[]> {
  try {
    const qs = category ? `?category=${encodeURIComponent(category)}` : "";
    const res = await fetch(`/api/sponsored${qs}`);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.products) ? data.products : [];
  } catch {
    return [];
  }
}

/** Log a sponsored tap so Joshua can report clicks back to brands. Fire-and-forget. */
export async function trackSponsoredClick(productId: string): Promise<void> {
  try {
    await fetch("/api/sponsored/click", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, deviceId: getOrCreateDeviceId() }),
    });
  } catch {
    /* never break the tap on a logging failure */
  }
}

/** Open a deal/affiliate URL, logging the click first for sponsored items. */
export async function openDealLink(url: string, sponsoredId?: string): Promise<void> {
  if (sponsoredId) await trackSponsoredClick(sponsoredId);
  if (isNative()) {
    await Browser.open({ url });
  } else {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}
