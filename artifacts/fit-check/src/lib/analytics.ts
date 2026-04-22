import { getOrCreateDeviceId } from "./deviceId";

export type EventType =
  | "app_open"
  | "page_view"
  | "outfit_generated"
  | "fit_card_opened"
  | "fit_card_shared"
  | "fit_card_saved"
  | "fit_saved"
  | "fit_unsaved"
  | "wardrobe_item_added"
  | "reminder_created"
  | "forecast_viewed"
  | "voice_used"
  | "location_set"
  | "style_changed"
  | "settings_opened";

function getLocationContext(): { city?: string; lat?: number; lon?: number } {
  try {
    const raw = localStorage.getItem("fitcheck.location");
    if (!raw) return {};
    const loc = JSON.parse(raw);
    return {
      city: loc?.name ?? undefined,
      lat: loc?.lat ?? undefined,
      lon: loc?.lon ?? undefined,
    };
  } catch {
    return {};
  }
}

export function trackEvent(
  eventType: EventType,
  metadata?: Record<string, unknown>
): void {
  const deviceId = getOrCreateDeviceId();
  const location = getLocationContext();

  fetch("/api/analytics/event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      deviceId,
      eventType,
      metadata: Object.fromEntries(
        Object.entries({ ...location, ...metadata }).filter(([, v]) => v !== undefined)
      ),
    }),
  }).catch(() => {
    // Silently ignore — analytics must never break the app
  });
}

export function trackPageView(page: string): void {
  trackEvent("page_view", { page });
}
