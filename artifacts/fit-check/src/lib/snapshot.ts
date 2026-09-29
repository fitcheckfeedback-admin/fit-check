import { Capacitor, registerPlugin } from "@capacitor/core";
import { isNative } from "@/lib/platform";

/**
 * Fit Check snapshot bridge (native iOS only).
 *
 * Mirrors today's fit + weather into the shared App Group container
 * (group.app.stylesense.fitcheck/fitcheck-snapshot.json) via the
 * FitCheckSnapshot Capacitor plugin. The Siri App Shortcuts ("what should I
 * wear today", "what's the weather like") and the home-screen widget read
 * this file — neither can reach the web app's JS state directly.
 *
 * Silent no-op on web/Android and whenever the native bridge is unavailable.
 */
export interface FitSnapshot {
  date: string; // yyyy-MM-dd, device-local
  locationName: string;
  tempF: number;
  condition: string;
  precipChancePct: number;
  fitItemNames: string[];
  fitSummary: string;
}

interface FitCheckSnapshotPlugin {
  saveSnapshot(options: { snapshot: FitSnapshot }): Promise<void>;
}

const FitCheckSnapshot = registerPlugin<FitCheckSnapshotPlugin>("FitCheckSnapshot");

export async function saveFitSnapshot(snapshot: FitSnapshot): Promise<void> {
  if (!isNative()) return;
  if (Capacitor.getPlatform() !== "ios") return;
  try {
    await FitCheckSnapshot.saveSnapshot({ snapshot });
  } catch {
    // Native bridge unavailable — never break the UI over this.
  }
}

/** Device-local date key, e.g. "2026-09-29". */
export function todayDateKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
