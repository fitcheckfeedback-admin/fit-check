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
  | "settings_opened"
  | "session_end";

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

// Session duration tracking — fires session_end when the user leaves or hides the app
let _sessionStart = Date.now();
let _sessionActive = true;

function _sendSessionEnd() {
  if (!_sessionActive) return;
  const durationSeconds = Math.round((Date.now() - _sessionStart) / 1000);
  if (durationSeconds < 3) return; // ignore page bounces
  _sessionActive = false;

  const deviceId = getOrCreateDeviceId();
  const location = getLocationContext();
  const payload = JSON.stringify({
    deviceId,
    eventType: "session_end",
    metadata: { ...location, durationSeconds },
  });

  // fetch + keepalive is more reliable than sendBeacon for JSON payloads:
  // sendBeacon Blob Content-Type can be mangled by proxies causing body-parse 400s.
  // keepalive fetch preserves the full request even after the page is unloaded.
  fetch("/api/analytics/event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: payload,
    keepalive: true,
  }).catch(() => {});
}

if (typeof window !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      _sendSessionEnd();
    } else {
      // User returned — start a fresh segment
      _sessionStart = Date.now();
      _sessionActive = true;
    }
  });
  window.addEventListener("beforeunload", _sendSessionEnd);
}
