import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'quiz_user_data';

export interface UserData {
  firstName: string;
  email: string;
  phone: string;
  lastPlayed?: string;
}

export const useUserMemory = () => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user data from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as UserData;
        setUserData(parsed);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save user data to localStorage
  const saveUserData = useCallback((data: UserData) => {
    try {
      const dataWithTimestamp = {
        ...data,
        lastPlayed: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataWithTimestamp));
      setUserData(dataWithTimestamp);
    } catch (error) {
      console.error('Error saving user data:', error);
    }
  }, []);

  // Clear user data
  const clearUserData = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      setUserData(null);
    } catch (error) {
      console.error('Error clearing user data:', error);
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
