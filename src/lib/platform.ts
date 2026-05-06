/**
 * Platform detection.
 *
 * We need to tell apart three runtimes:
 *   - SSR (Node, server)
 *   - Browser (regular web app, PWA)
 *   - Capacitor native (Android APK / iOS)
 *
 * The Capacitor runtime exposes a `Capacitor` global on `window`. We avoid
 * importing @capacitor/core directly at the module top level so the web
 * bundle stays tiny and SSR doesn't choke.
 */

export function isServer(): boolean {
  return typeof window === "undefined";
}

export function isBrowser(): boolean {
  return typeof window !== "undefined";
}

interface CapacitorGlobal {
  isNativePlatform?: () => boolean;
  getPlatform?: () => string;
}

export function isCapacitor(): boolean {
  if (isServer()) return false;
  const w = window as unknown as { Capacitor?: CapacitorGlobal };
  if (!w.Capacitor) return false;
  if (typeof w.Capacitor.isNativePlatform === "function") {
    return w.Capacitor.isNativePlatform();
  }
  // Fallback — treat any non-web platform as native.
  if (typeof w.Capacitor.getPlatform === "function") {
    const p = w.Capacitor.getPlatform();
    return p === "android" || p === "ios";
  }
  return false;
}

export function getPlatform(): "server" | "web" | "android" | "ios" {
  if (isServer()) return "server";
  const w = window as unknown as { Capacitor?: CapacitorGlobal };
  if (w.Capacitor?.getPlatform) {
    const p = w.Capacitor.getPlatform();
    if (p === "android" || p === "ios") return p;
  }
  return "web";
}
