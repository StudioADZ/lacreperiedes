import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface SecretAccessState {
  hasAccess: boolean;
  isLoading: boolean;
  accessToken: string | null;
  secretCode: string | null;
  isAdminAccess: boolean;
}

// Session duration: 30 minutes max for regular users
const SESSION_DURATION_MS = 30 * 60 * 1000;

// ✅ Prefix keys to avoid collisions
const STORAGE_TOKEN_KEY = "secret_access_token";
const STORAGE_TS_KEY = "secret_access_timestamp";
const ADMIN_ACCESS_KEY = "admin_secret_menu_access";

function isBrowser() {
  return typeof window !== "undefined";
}

function safeGet(key: string) {
  if (!isBrowser()) return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string) {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

function safeRemove(key: string) {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

function safeNowTs() {
  return Date.now();
}

// ✅ randomUUID fallback
function makeToken() {
  if (isBrowser() && "crypto" in window && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }
  // Fallback UUID-ish (good enough for client token, but randomUUID is preferred)
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export const useSecretAccess = () => {
  const [state, setState] = useState<SecretAccessState>({
    hasAccess: false,
    isLoading: true,
    accessToken: null,
    secretCode: null,
    isAdminAccess: false,
  });

  const clearLocalStorage = useCallback(() => {
    safeRemove(STORAGE_TOKEN_KEY);
    safeRemove(STORAGE_TS_KEY);
  }, []);

  const checkAccess = useCallback(async () => {
    if (!isBrowser()) {
      setState({
        hasAccess: false,
        isLoading: false,
        accessToken: null,
        secretCode: null,
        isAdminAccess: false,
      });
      return;
    }

    // First check for admin permanent access (⚠️ UI bypass only, not real security)
    const adminAccess = safeGet(ADMIN_ACCESS_KEY);
    if (adminAccess === "true") {
      setState({
        hasAccess: true,
        isLoading: false,
        accessToken: "admin",
        secretCode: "ADMIN",
        isAdminAccess: true,
      });
      return;
    }

    const storedToken = safeGet(STORAGE_TOKEN_KEY);
    const storedTimestamp = safeGet(STORAGE_TS_KEY);

    // Check if session has expired (30 minutes max)
    if (storedTimestamp) {
      const timestamp = parseInt(storedTimestamp, 10);
      const now = safeNowTs();

      if (!Number.isFinite(timestamp) || now - timestamp > SESSION_DURATION_MS) {
        clearLocalStorage();
        setState({
          hasAccess: false,
          isLoading: false,
          accessToken: null,
          secretCode: null,
          isAdminAccess: false,
        });
        return;
      }
    }

    if (!storedToken) {
      setState({
        hasAccess: false,
        isLoading: false,
        accessToken: null,
        secretCode: null,
        isAdminAccess: false,
      });
      return;
    }

    try {
      // Verify token is still valid in database
      const { data, error } = await supabase
        .from("secret_access")
        .select("access_token, secret_code, expires_at")
        .eq("access_token", storedToken)
        .gt("expires_at", new Date().toISOString())
        .maybeSingle();

      if (error || !data) {
        clearLocalStorage();
        setState({
          hasAccess: false,
          isLoading: false,
          accessToken: null,
          secretCode: null,
          isAdminAccess: false,
        });
        return;
      }

      // Update timestamp to extend session (sliding window)
      safeSet(STORAGE_TS_KEY, safeNowTs().toString());

      setState({
        hasAccess: true,
        isLoading: false,
        accessToken: data.access_token,
        secretCode: data.secret_code,
        isAdminAccess: false,
      });
    } catch (error) {
      console.error("Error checking secret access:", error);
      clearLocalStorage();
      setState({
        hasAccess: false,
        isLoading: false,
        accessToken: null,
        secretCode: null,
        isAdminAccess: false,
      });
    }
  }, [clearLocalStorage]);

  useEffect(() => {
    let isMounted = true;

    (async () => {
      if (!isMounted) return;
      await checkAccess();
    })();

    return () => {
      isMounted = false;
    };
  }, [checkAccess]);

  const verifyCode = useCallback(
    async (code: string): Promise<boolean> => {
      try {
        const { data: menu } = await supabase
          .from("secret_menu")
          .select("secret_code")
          .eq("is_active", true)
          .order("week_start", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!menu?.secret_code) return false;

        // Check if code matches (case insensitive)
        if (menu.secret_code.toUpperCase() === code.toUpperCase()) {
          // Generate new token client-side for anonymous access
          const token = makeToken();
          const weekStart = getWeekStartLocal();

          const { error } = await supabase.from("secret_access").insert({
            email: "anonymous@menu-secret.local",
            phone: "0000000000",
            first_name: "Visiteur",
            access_token: token,
            secret_code: code.toUpperCase(),
            week_start: weekStart,
          });

          if (error) {
            console.error("Error inserting access:", error);
            return false;
          }

          safeSet(STORAGE_TOKEN_KEY, token);
          safeSet(STORAGE_TS_KEY, safeNowTs().toString());

          setState({
            hasAccess: true,
            isLoading: false,
            accessToken: token,
            secretCode: code.toUpperCase(),
            isAdminAccess: false,
          });
          return true;
        }

        return false;
      } catch (error) {
        console.error("Error verifying code:", error);
        return false;
      }
    },
    [],
  );

  // Admin bypass: verify admin password and grant permanent access
  const verifyAdminAccess = useCallback(async (adminPassword: string): Promise<boolean> => {
    try {
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${SUPABASE_URL}/functions/v1/admin-scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "stats", adminPassword }),
      });

      if (response.ok) {
        safeSet(ADMIN_ACCESS_KEY, "true");
        setState({
          hasAccess: true,
          isLoading: false,
          accessToken: "admin",
          secretCode: "ADMIN",
          isAdminAccess: true,
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error verifying admin access:", error);
      return false;
    }
  }, []);

  const grantAccessFromQuiz = useCallback(
    async (email: string, phone: string, firstName: string, secretCode: string): Promise<string | null> => {
      try {
        const weekStart = getWeekStartLocal();

        // Always generate a new token for fresh 30-min session
        const token = makeToken();

        const { error } = await supabase.from("secret_access").insert({
          email,
          phone,
          first_name: firstName,
          access_token: token,
          secret_code: secretCode,
          week_start: weekStart,
        });

        if (error) {
          console.error("Error granting access:", error);
          return null;
        }

        safeSet(STORAGE_TOKEN_KEY, token);
        safeSet(STORAGE_TS_KEY, safeNowTs().toString());

        setState({
          hasAccess: true,
          isLoading: false,
          accessToken: token,
          secretCode,
          isAdminAccess: false,
        });
        return token;
      } catch (error) {
        console.error("Error granting access:", error);
        return null;
      }
    },
    [],
  );

  const revokeAccess = useCallback(() => {
    clearLocalStorage();
    safeRemove(ADMIN_ACCESS_KEY);
    setState({
      hasAccess: false,
      isLoading: false,
      accessToken: null,
      secretCode: null,
      isAdminAccess: false,
    });
  }, [clearLocalStorage]);

  return {
    ...state,
    verifyCode,
    verifyAdminAccess,
    grantAccessFromQuiz,
    revokeAccess,
    refreshAccess: checkAccess,
  };
};

// ✅ Local date "YYYY-MM-DD" to avoid UTC day shift
function getWeekStartLocal(): string {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sunday
  const diff = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek; // Monday as start
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  monday.setHours(0, 0, 0, 0);

  const y = monday.getFullYear();
  const m = String(monday.getMonth() + 1).padStart(2, "0");
  const d = String(monday.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
