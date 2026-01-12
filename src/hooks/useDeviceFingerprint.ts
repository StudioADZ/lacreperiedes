import { useState, useEffect } from 'react';

// Simple device fingerprint generator
// In production, consider using @fingerprintjs/fingerprintjs
const generateFingerprint = (): string => {
  const nav = window.navigator;
  const screen = window.screen;
  
  const data = [
    nav.userAgent,
    nav.language,
    screen.colorDepth,
    screen.width + 'x' + screen.height,
    new Date().getTimezoneOffset(),
    nav.hardwareConcurrency || 'unknown',
    // @ts-ignore
    nav.deviceMemory || 'unknown',
  ].join('|');

  // Simple hash function
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Add random component stored in localStorage for uniqueness
  let storedRandom = localStorage.getItem('device_id');
  if (!storedRandom) {
    storedRandom = Math.random().toString(36).substring(2, 15);
    localStorage.setItem('device_id', storedRandom);
  }
  
  return Math.abs(hash).toString(36) + storedRandom;
};

export const useDeviceFingerprint = () => {
  const [fingerprint, setFingerprint] = useState<string | null>(null);
  
  useEffect(() => {
    const fp = generateFingerprint();
    setFingerprint(fp);
  }, []);
  
  return fingerprint;
};