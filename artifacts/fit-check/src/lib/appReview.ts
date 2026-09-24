import { Capacitor, registerPlugin } from "@capacitor/core";
import { isNative } from "@/lib/platform";

/**
 * In-app App Store rating prompt.
 *
 * Fires StoreKit's SKStoreReviewController after the user has had a few
 * genuinely positive moments (successful AI stylist generations, saved
 * outfits). Rules:
 * - iOS native only; silent no-op on web/Android.
 * - Requested at most ONCE per install — never nags.
 * - No incentives, no custom review UI; iOS throttles actual display.
 */
interface AppReviewPlugin {
  requestReview(): Promise<void>;
}

const AppReview = registerPlugin<AppReviewPlugin>("AppReview");

const MOMENTS_KEY = "fitcheck.review.positiveMoments";
const REQUESTED_KEY = "fitcheck.review.requested";
// Prompt after the user has gotten real value a few times, not on first use.
const REQUIRED_MOMENTS = 3;

function getMoments(): number {
  try {
    return Number(localStorage.getItem(MOMENTS_KEY) || 0) || 0;
  } catch {
    return 0;
  }
}

function alreadyRequested(): boolean {
  try {
    return localStorage.getItem(REQUESTED_KEY) === "1";
  } catch {
    return true;
  }
}

function recordMoment() {
  try {
    const next = getMoments() + 1;
    localStorage.setItem(MOMENTS_KEY, String(next));
    if (next >= REQUIRED_MOMENTS) void maybeRequestAppReview();
  } catch {
    // Storage unavailable — skip silently.
  }
}

/** Call after a successful AI stylist outfit generation. */
export function recordStylistSuccess() {
  recordMoment();
}

/** Call after the user saves an outfit combo. */
export function recordFitSaved() {
  recordMoment();
}

async function maybeRequestAppReview() {
  if (!isNative()) return;
  if (Capacitor.getPlatform() !== "ios") return;
  if (alreadyRequested()) return;

  // Mark requested BEFORE calling: one shot per install, no repeat prompts.
  try {
    localStorage.setItem(REQUESTED_KEY, "1");
  } catch {
    /* ignore */
  }

  // Let the success UI settle before the system prompt appears.
  await new Promise((resolve) => setTimeout(resolve, 2000));

  try {
    await AppReview.requestReview();
  } catch {
    // Native bridge unavailable — silent no-op.
  }
}
