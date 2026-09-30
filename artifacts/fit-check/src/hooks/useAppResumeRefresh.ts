import { useEffect } from "react";
import { App } from "@capacitor/app";
import type { PluginListenerHandle } from "@capacitor/core";
import { isNative } from "@/lib/platform";
import { queryClient } from "@/lib/queryClient";

// Must stay in sync with the queryKeys in useWeather.ts,
// useNWSObservation.ts and useNWSAlerts.ts. Prefixes match the full keys
// (which append lat/lon), so one invalidation refreshes every location.
const WEATHER_QUERY_PREFIXES = [
  ["weather"],
  ["nws-observation"],
  ["nws-alerts"],
] as const;

/**
 * Invalidates the weather queries the moment the app returns to the foreground,
 * so weather refetches immediately instead of waiting for the background
 * interval.
 *
 * This must cover ALL weather data sources, not just the Open-Meteo forecast:
 * the Home screen's big temperature comes from the NWS station observation
 * feed, which has its own query key — invalidating only ["weather"] left the
 * displayed temperature stale until the next interval or a manual refresh.
 *
 * react-query's `refetchOnWindowFocus` does not fire reliably inside the
 * Capacitor WebView on iOS, so on native we listen to Capacitor's `resume`
 * event instead. On web we fall back to `document.visibilitychange`.
 *
 * Call once, near the root of the app. The effect is StrictMode-safe: the
 * listener is removed in the cleanup, and a `cancelled` flag guards the race
 * where cleanup runs before the async `addListener` promise resolves.
 */
export function useAppResumeRefresh() {
  useEffect(() => {
    const refreshWeather = () => {
      for (const queryKey of WEATHER_QUERY_PREFIXES) {
        void queryClient.invalidateQueries({ queryKey: [...queryKey] });
      }
    };

    let cancelled = false;
    let nativeHandle: PluginListenerHandle | undefined;
    let removeVisibilityListener: (() => void) | undefined;

    if (isNative()) {
      void App.addListener("resume", refreshWeather).then((handle) => {
        if (cancelled) {
          // StrictMode unmounted before registration completed — drop it.
          void handle.remove();
        } else {
          nativeHandle = handle;
        }
      });
    } else {
      const onVisibilityChange = () => {
        if (document.visibilityState === "visible") refreshWeather();
      };
      document.addEventListener("visibilitychange", onVisibilityChange);
      removeVisibilityListener = () =>
        document.removeEventListener("visibilitychange", onVisibilityChange);
    }

    return () => {
      cancelled = true;
      if (nativeHandle) void nativeHandle.remove();
      removeVisibilityListener?.();
    };
  }, []);
}
