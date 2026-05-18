import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SecretAccessState {
  hasAccess: boolean;
  isLoading: boolean;
  accessToken: string | null;
  secretCode: string | null;
  isAdminAccess: boolean;
}

// Session duration: 1 hour max for regular users
const SESSION_DURATION_MS = 60 * 60 * 1000;

export const useSecretAccess = () => {
  const [state, setState] = useState<SecretAccessState>({
    hasAccess: false,
    isLoading: true,
    accessToken: null,
    secretCode: null,
    isAdminAccess: false,
  });

  useEffect(() => {
    // Clean up any legacy client-side admin flag that previously granted unverified access
    try { localStorage.removeItem('admin_secret_menu_access'); } catch (_) { /* ignore */ }
    checkAccess();
  }, []);

  const checkAccess = async () => {

    const storedToken = localStorage.getItem('secret_access_token');
    const storedTimestamp = localStorage.getItem('secret_access_timestamp');
    
    // Check if session has expired (30 minutes max)
    if (storedTimestamp) {
      const timestamp = parseInt(storedTimestamp, 10);
      const now = Date.now();
      if (now - timestamp > SESSION_DURATION_MS) {
        // Session expired - clear and require code again
        clearLocalStorage();
        setState({ hasAccess: false, isLoading: false, accessToken: null, secretCode: null, isAdminAccess: false });
        return;
      }
    }
    
    if (!storedToken) {
      setState({ hasAccess: false, isLoading: false, accessToken: null, secretCode: null, isAdminAccess: false });
      return;
    }

    try {
      // Verify token through the protected database function (direct reads are blocked by RLS)
      const { data: isValid, error } = await supabase.rpc('verify_secret_access', { p_token: storedToken });

      if (error || !isValid) {
        // Token expired or invalid
        clearLocalStorage();
        setState({ hasAccess: false, isLoading: false, accessToken: null, secretCode: null, isAdminAccess: false });
        return;
      }

      // Update timestamp to extend session (sliding window)
      localStorage.setItem('secret_access_timestamp', Date.now().toString());
      const storedCode = localStorage.getItem('secret_access_code');

      setState({
        hasAccess: true,
        isLoading: false,
        accessToken: storedToken,
        secretCode: storedCode,
        isAdminAccess: false,
      });
    } catch (error) {
      console.error('Error checking secret access:', error);
      clearLocalStorage();
      setState({ hasAccess: false, isLoading: false, accessToken: null, secretCode: null, isAdminAccess: false });
    }
  };

  const clearLocalStorage = () => {
    localStorage.removeItem('secret_access_token');
    localStorage.removeItem('secret_access_timestamp');
    localStorage.removeItem('secret_access_code');
  };

  const verifyCode = async (code: string): Promise<boolean> => {
    try {
      // Use the database function to validate code (handles daily + weekly)
      const { data: isValid, error } = await supabase
        .rpc('validate_secret_code', { p_code: code.trim().toUpperCase() });
      
      if (error) {
        console.error('Code validation error:', error);
        return false;
      }
      
      if (!isValid) {
        return false;
      }

      // Code is valid - grant access with 1-hour session via protected RPC
      const weekStart = getWeekStart();

      const { data: token, error: grantError } = await supabase.rpc('grant_secret_access', {
        p_email: 'anonymous@menu-secret.local',
        p_phone: '0000000000',
        p_first_name: 'Visiteur',
        p_secret_code: code.toUpperCase(),
        p_week_start: weekStart,
      });

      if (grantError || !token) {
        console.error('Error granting access:', grantError);
        return false;
      }

      // Store token, timestamp and entered code for 1-hour session tracking
      localStorage.setItem('secret_access_token', token);
      localStorage.setItem('secret_access_timestamp', Date.now().toString());
      localStorage.setItem('secret_access_code', code.toUpperCase());
      
      setState({
        hasAccess: true,
        isLoading: false,
        accessToken: token,
        secretCode: code.toUpperCase(),
        isAdminAccess: false,
      });
      return true;
    } catch (error) {
      console.error('Error verifying code:', error);
      return false;
    }
  };

  // Admin verification: validate the password server-side, then grant a regular
  // 1-hour secret-access token. No persistent client-side admin flag.
  const verifyAdminAccess = async (adminPassword: string): Promise<boolean> => {
    try {
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${SUPABASE_URL}/functions/v1/admin-scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'stats', adminPassword }),
      });

      if (!response.ok) return false;

      const weekStart = getWeekStart();
      const { data: token, error } = await supabase.rpc('grant_secret_access', {
        p_email: 'admin@menu-secret.local',
        p_phone: '0000000000',
        p_first_name: 'Admin',
        p_secret_code: 'ADMIN',
        p_week_start: weekStart,
      });

      if (error || !token) return false;

      localStorage.setItem('secret_access_token', token);
      localStorage.setItem('secret_access_timestamp', Date.now().toString());
      localStorage.setItem('secret_access_code', 'ADMIN');

      setState({
        hasAccess: true,
        isLoading: false,
        accessToken: token,
        secretCode: 'ADMIN',
        isAdminAccess: true,
      });
      return true;
    } catch (error) {
      console.error('Error verifying admin access:', error);
      return false;
    }
  };

  const grantAccessFromQuiz = async (
    email: string,
    phone: string,
    firstName: string,
    secretCode: string
  ): Promise<string | null> => {
    try {
      const weekStart = getWeekStart();

      const { data: token, error } = await supabase.rpc('grant_secret_access', {
        p_email: email,
        p_phone: phone,
        p_first_name: firstName,
        p_secret_code: secretCode,
        p_week_start: weekStart,
      });

      if (error || !token) {
        console.error('Error granting access:', error);
        return null;
      }

      // Store token AND timestamp
      localStorage.setItem('secret_access_token', token);
      localStorage.setItem('secret_access_timestamp', Date.now().toString());
      localStorage.setItem('secret_access_code', secretCode);
      
      setState({
        hasAccess: true,
        isLoading: false,
        accessToken: token,
        secretCode,
        isAdminAccess: false,
      });
      return token;
    } catch (error) {
      console.error('Error granting access:', error);
      return null;
    }
  };

  const revokeAccess = () => {
    clearLocalStorage();
    localStorage.removeItem(ADMIN_ACCESS_KEY);
    setState({ hasAccess: false, isLoading: false, accessToken: null, secretCode: null, isAdminAccess: false });
  };

  return {
    ...state,
    verifyCode,
    verifyAdminAccess,
    grantAccessFromQuiz,
    revokeAccess,
    refreshAccess: checkAccess,
  };
};

function getWeekStart(): string {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diff = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString().split('T')[0];
}
