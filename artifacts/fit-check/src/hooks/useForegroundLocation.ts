import { useEffect, useRef } from "react";
import { App } from "@capacitor/app";
import type { PluginListenerHandle } from "@capacitor/core";
import { isNative } from "@/lib/platform";
import { reverseGeocode } from "@/lib/weather";
import { useFitCheckSettings } from "./useFitCheckSettings";

// How often a foreground GPS fix may run (battery guard).
const FIX_THROTTLE_MS = 10 * 60 * 1000;
const FIX_THROTTLE_KEY = "fitcheck.last-foreground-fix";
// Only rewrite the saved location when the user actually moved — avoids
// jitter rewrites and pointless reverse-geocode calls.
const MOVE_THRESHOLD_KM = 1.5;

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return 2 * R * Math.asin(Math.sqrt(a));
}

/**
 * Reacquires the GPS position when the app returns to the foreground (and
 * once on cold start), so the displayed city and weather follow the user
 * when they travel — no manual refresh needed.
 *
 * Behavior:
 * - Throttled to at most one fix per 10 minutes (battery guard).
 * - Forces a fresh fix (maximumAge 0); a stale cached fix would show the
 *   wrong city right after arriving somewhere new.
 * - Only updates the saved location when the user moved > 1.5 km.
 * - Fully silent on failure (denied/unavailable/timeout): keeps the last
 *   known location instead of blanking it.
 *
 * Call once, near the root of the app. StrictMode-safe (mirrors the
 * listener pattern in useAppResumeRefresh).
 */
export function useForegroundLocation() {
  const { settings, updateSettings } = useFitCheckSettings();
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const updateRef = useRef(updateSettings);
  updateRef.current = updateSettings;

  useEffect(() => {
    let cancelled = false;

    const refreshLocation = () => {
      try {
        const last = Number(localStorage.getItem(FIX_THROTTLE_KEY) || 0);
        if (Date.now() - last < FIX_THROTTLE_MS) return;
      } catch {
        /* storage unavailable: proceed */
      }
      if (!("geolocation" in navigator)) return;

      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          if (cancelled) return;
          try {
            localStorage.setItem(FIX_THROTTLE_KEY, String(Date.now()));
          } catch {
            /* ignore */
          }
          const { latitude, longitude } = pos.coords;
          const prev = settingsRef.current.location;
          if (prev && haversineKm(prev.lat, prev.lon, latitude, longitude) < MOVE_THRESHOLD_KM) {
            return;
          }
          let name: string | null = null;
          try {
            name = await reverseGeocode(latitude, longitude);
          } catch {
            name = null;
          }
          if (cancelled || !name) return;
          updateRef.current({ location: { lat: latitude, lon: longitude, name } });
        },
        () => {
          /* silent: keep last known location */
        },
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 0 }
      );
    };

    // Cold start: let startup settle first.
    const startupTimer = setTimeout(refreshLocation, 2000);

    let nativeHandle: PluginListenerHandle | undefined;
    let removeVisibilityListener: (() => void) | undefined;
    if (isNative()) {
      void App.addListener("resume", refreshLocation).then((handle) => {
        if (cancelled) {
          void handle.remove();
        } else {
          nativeHandle = handle;
        }
      });
    } else {
      const onVisibilityChange = () => {
        if (document.visibilityState === "visible") refreshLocation();
      };
      document.addEventListener("visibilitychange", onVisibilityChange);
      removeVisibilityListener = () =>
        document.removeEventListener("visibilitychange", onVisibilityChange);
    }

    return () => {
      cancelled = true;
      clearTimeout(startupTimer);
      if (nativeHandle) void nativeHandle.remove();
      removeVisibilityListener?.();
    };
  }, []);
}
