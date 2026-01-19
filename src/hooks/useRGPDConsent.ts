import { useState, useEffect, useCallback } from 'react';

const CONSENT_KEY = 'rgpd_consent';
const CONSENT_VERSION = '1.0'; // Increment to require re-consent

interface ConsentData {
  accepted: boolean;
  version: string;
  timestamp: string;
}

export const useRGPDConsent = () => {
  const [hasConsented, setHasConsented] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check consent on mount
  useEffect(() => {
    const checkConsent = () => {
      try {
        const stored = localStorage.getItem(CONSENT_KEY);
        if (stored) {
          const data: ConsentData = JSON.parse(stored);
          // Check if consent version matches current version
          if (data.version === CONSENT_VERSION && data.accepted) {
            setHasConsented(true);
          } else {
            setHasConsented(false);
          }
        } else {
          setHasConsented(false);
        }
      } catch {
        setHasConsented(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkConsent();
  }, []);

  // Accept consent
  const acceptConsent = useCallback(() => {
    const data: ConsentData = {
      accepted: true,
      version: CONSENT_VERSION,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem(CONSENT_KEY, JSON.stringify(data));
    setHasConsented(true);
  }, []);

  // Revoke consent (for settings page)
  const revokeConsent = useCallback(() => {
    localStorage.removeItem(CONSENT_KEY);
    setHasConsented(false);
  }, []);

  return {
    hasConsented,
    isLoading,
    acceptConsent,
    revokeConsent,
  };
};
