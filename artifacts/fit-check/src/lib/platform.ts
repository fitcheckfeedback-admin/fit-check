export function isNative(): boolean {
  return !!(window as any).Capacitor?.isNativePlatform?.();
}
