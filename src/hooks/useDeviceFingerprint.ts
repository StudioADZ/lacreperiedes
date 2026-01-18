import { useEffect, useState } from "react";

type Options = {
  storageKey?: string;
};

const DEFAULT_STORAGE_KEY = "device_id";

// Small safe wrapper around localStorage (can throw in some browsers / contexts)
function safeStorageGet(key: string): string | null {
  try {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeStorageSet(key: string, value: string) {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(key, value);
  } catch {
    // ignore (private mode / blocked storage)
  }
}

// Simple (non-crypto) hash — fine for bucketing, NOT security
function simpleHash32(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0; // 32-bit
  }
  return hash;
}

function buildEnvironmentSignature(): string {
  const nav = window.navigator;
  const scr = window.screen;

  return [
    nav.userAgent,
    nav.language,
    scr?.colorDepth ?? "unknown",
    scr ? `${scr.width}x${scr.height}` : "unknown",
    new Date().getTimezoneOffset(),
    nav.hardwareConcurrency ?? "unknown",
    // @ts-ignore
    nav.deviceMemory ?? "unknown",
  ].join("|");
}

function getOrCreateDeviceId(storageKey: string): string {
  // Prefer stable per-device id stored in localStorage
  let id = safeStorageGet(storageKey);
  if (id) return id;

  // Fallback: generate random id
  // (crypto if available, else Math.random)
  const randomPart =
    typeof window !== "undefined" && "crypto" in window && "getRandomValues" in window.crypto
      ? Array.from(window.crypto.getRandomValues(new Uint8Array(16)))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("")
      : Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);

  id = `dev_${randomPart}`;
  safeStorageSet(storageKey, id);
  return id;
}

function generateFingerprint(storageKey: string): string | null {
  if (typeof window === "undefined") return null;

  // Stable device id (main identifier)
  const deviceId = getOrCreateDeviceId(storageKey);

  // Optional: environment signature hash (helps detect big device changes without changing ID)
  const signature = buildEnvironmentSignature();
  const signatureHash = Math.abs(simpleHash32(signature)).toString(36);

  // Keep backward spirit: return a single string
  // But now deviceId stays stable even if UA/screen changes
  return `${deviceId}.${signatureHash}`;
}

export const useDeviceFingerprint = (options?: Options) => {
  const [fingerprint, setFingerprint] = useState<string | null>(null);

  useEffect(() => {
    const storageKey = options?.storageKey ?? DEFAULT_STORAGE_KEY;
    const fp = generateFingerprint(storageKey);
    setFingerprint(fp);
    // storageKey only: avoids reruns unless config changes
  }, [options?.storageKey]);

  return fingerprint;
};
