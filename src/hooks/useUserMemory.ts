import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "quiz_user_data";

// ✅ Optional: versioning + TTL (change without breaking)
const STORAGE_VERSION = "1";
const TTL_DAYS = 180; // set to 0 to disable TTL
const TTL_MS = TTL_DAYS > 0 ? TTL_DAYS * 24 * 60 * 60 * 1000 : 0;

export interface UserData {
  firstName: string;
  email: string;
  phone: string;
  lastPlayed?: string;
}

// ✅ Stored shape (non-destructive: still reads old format)
type StoredUserData = UserData & {
  _v?: string;
};

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

function isValidUserData(data: any): data is UserData {
  if (!data || typeof data !== "object") return false;
  const { firstName, email, phone, lastPlayed } = data;
  if (typeof firstName !== "string" || !firstName.trim()) return false;
  if (typeof email !== "string" || !email.trim()) return false;
  if (typeof phone !== "string" || !phone.trim()) return false;
  if (lastPlayed !== undefined && typeof lastPlayed !== "string") return false;
  return true;
}

function isExpired(lastPlayed?: string) {
  if (!TTL_MS) return false;
  if (!lastPlayed) return false;
  const t = Date.parse(lastPlayed);
  if (Number.isNaN(t)) return false; // if invalid date, don't auto-expire
  return Date.now() - t > TTL_MS;
}

export const useUserMemory = () => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user data from localStorage on mount
  useEffect(() => {
    try {
      const stored = safeGet(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as StoredUserData;

        // ✅ Backward compatible: accepts old format without _v
        if (isValidUserData(parsed)) {
          if (isExpired(parsed.lastPlayed)) {
            safeRemove(STORAGE_KEY);
            setUserData(null);
          } else {
            setUserData(parsed);
          }
        } else {
          // invalid payload => clean to prevent weird states
          safeRemove(STORAGE_KEY);
          setUserData(null);
        }
      }
    } catch (error) {
      console.error("Error loading user data:", error);
      safeRemove(STORAGE_KEY);
      setUserData(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // (Optional) Sync between tabs without changing your API
  useEffect(() => {
    if (!isBrowser()) return;

    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return;
      try {
        if (!e.newValue) {
          setUserData(null);
          return;
        }
        const parsed = JSON.parse(e.newValue) as StoredUserData;
        if (isValidUserData(parsed)) {
          if (isExpired(parsed.lastPlayed)) {
            setUserData(null);
          } else {
            setUserData(parsed);
          }
        }
      } catch {
        // ignore
      }
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Save user data to localStorage
  const saveUserData = useCallback((data: UserData) => {
    try {
      const dataWithTimestamp: StoredUserData = {
        ...data,
        lastPlayed: new Date().toISOString(),
        _v: STORAGE_VERSION,
      };

      safeSet(STORAGE_KEY, JSON.stringify(dataWithTimestamp));
      setUserData(dataWithTimestamp);
    } catch (error) {
      console.error("Error saving user data:", error);
    }
  }, []);

  // Clear user data
  const clearUserData = useCallback(() => {
    try {
      safeRemove(STORAGE_KEY);
      setUserData(null);
    } catch (error) {
      console.error("Error clearing user data:", error);
    }
  }, []);

  // Check if user has played before
  const hasPlayedBefore = Boolean(userData?.firstName && userData?.email && userData?.phone);

  return {
    userData,
    isLoading,
    saveUserData,
    clearUserData,
    hasPlayedBefore,
  };
};
