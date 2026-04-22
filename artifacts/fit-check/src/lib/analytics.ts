import { getOrCreateDeviceId } from "./deviceId";

const API_BASE = `${import.meta.env.BASE_URL}api`.replace(/\/+/g, "/").replace(/^\/api/, "/api");

export type EventType =
  | "app_open"
  | "outfit_generated"
  | "fit_card_opened"
  | "fit_card_shared"
  | "fit_card_saved"
  | "wardrobe_item_added"
  | "page_view";

export function trackEvent(eventType: EventType, metadata?: Record<string, unknown>): void {
  const deviceId = getOrCreateDeviceId();
  // Fire-and-forget — never block the UI
  fetch(`/api/analytics/event`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ deviceId, eventType, metadata }),
  }).catch(() => {
    // Silently ignore — analytics should never break the app
  });
}
