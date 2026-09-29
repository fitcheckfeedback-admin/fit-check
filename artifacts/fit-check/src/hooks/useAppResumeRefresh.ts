import { useEffect } from "react";
import { App } from "@capacitor/app";
import type { PluginListenerHandle } from "@capacitor/core";
import { isNative } from "@/lib/platform";
import { queryClient } from "@/lib/queryClient";

// Must stay in sync with the queryKey in src/hooks/useWeather.ts.
const WEATHER_QUERY_PREFIX = ["weather"] as const;

/**
 * Invalidates the weather query the moment the app returns to the foreground,
 * so weather refetches immediately instead of waiting for the 5-minute
 * background interval.
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
      void queryClient.invalidateQueries({ queryKey: WEATHER_QUERY_PREFIX });
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
