import { useState, useEffect, useCallback } from "react";

// ✅ Prefix to avoid collisions across apps on same domain
const CONSENT_KEY = "creperie:rgpd_consent";
const CONSENT_VERSION = "1.0"; // Increment to require re-consent

interface ConsentData {
  accepted: boolean;
  version: string;
  timestamp: string;
  // ✅ Future-proof fields (optional, non-breaking)
  // categories?: { necessary: true; analytics?: boolean; marketing?: boolean };
}

function isConsentData(value: any): value is ConsentData {
  return (
    value &&
    typeof value === "object" &&
    typeof value.accepted === "boolean" &&
    typeof value.version === "string" &&
    typeof value.timestamp === "string"
  );
}

function readConsent(): boolean {
  // ✅ SSR guard
  if (typeof window === "undefined") return false;

  try {
    const stored = window.localStorage.getItem(CONSENT_KEY);
    if (!stored) return false;

    const parsed = JSON.parse(stored);
    if (!isConsentData(parsed)) return false;

    return parsed.accepted === true && parsed.version === CONSENT_VERSION;
  } catch {
    return false;
  }
}

export const useRGPDConsent = () => {
  const [hasConsented, setHasConsented] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check consent on mount + keep in sync across tabs
  useEffect(() => {
    // ✅ SSR guard
    if (typeof window === "undefined") {
      setHasConsented(false);
      setIsLoading(false);
      return;
    }

    const sync = () => {
      setHasConsented(readConsent());
      setIsLoading(false);
    };

    sync();

    // ✅ Multi-tab sync
    const onStorage = (e: StorageEvent) => {
      if (e.key === CONSENT_KEY) {
        setHasConsented(readConsent());
      }
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Accept consent
  const acceptConsent = useCallback(() => {
    if (typeof window === "undefined") return;

    const data: ConsentData = {
      accepted: true,
      version: CONSENT_VERSION,
      timestamp: new Date().toISOString(),
    };

    window.localStorage.setItem(CONSENT_KEY, JSON.stringify(data));
    setHasConsented(true);
  }, []);

  // Revoke consent (for settings page)
  const revokeConsent = useCallback(() => {
    if (typeof window === "undefined") return;

    window.localStorage.removeItem(CONSENT_KEY);
    setHasConsented(false);
  }, []);

  return {
    hasConsented,
    isLoading,
    acceptConsent,
    revokeConsent,
  };
};
