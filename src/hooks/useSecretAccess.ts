import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SecretAccessState {
  hasAccess: boolean;
  isLoading: boolean;
  accessToken: string | null;
  secretCode: string | null;
  isAdminAccess: boolean;
}

// Session duration: 30 minutes max for regular users
const SESSION_DURATION_MS = 30 * 60 * 1000;

// Admin access key in localStorage
const ADMIN_ACCESS_KEY = 'admin_secret_menu_access';

export const useSecretAccess = () => {
  const [state, setState] = useState<SecretAccessState>({
    hasAccess: false,
    isLoading: true,
    accessToken: null,
    secretCode: null,
    isAdminAccess: false,
  });

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    // First check for admin permanent access
    const adminAccess = localStorage.getItem(ADMIN_ACCESS_KEY);
    if (adminAccess === 'true') {
      setState({
        hasAccess: true,
        isLoading: false,
        accessToken: 'admin',
        secretCode: 'ADMIN',
        isAdminAccess: true,
      });
      return;
    }

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
      // Verify token is still valid in database
      const { data, error } = await supabase
        .from('secret_access')
        .select('access_token, secret_code, expires_at')
        .eq('access_token', storedToken)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      if (error || !data) {
        // Token expired or invalid
        clearLocalStorage();
        setState({ hasAccess: false, isLoading: false, accessToken: null, secretCode: null, isAdminAccess: false });
        return;
      }

      // Update timestamp to extend session (sliding window)
      localStorage.setItem('secret_access_timestamp', Date.now().toString());

      setState({
        hasAccess: true,
        isLoading: false,
        accessToken: data.access_token,
        secretCode: data.secret_code,
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

      // Code is valid - grant access with 30-min session
      const token = crypto.randomUUID();
      const weekStart = getWeekStart();

      const { error: insertError } = await supabase
        .from('secret_access')
        .insert({
          email: 'anonymous@menu-secret.local',
          phone: '0000000000',
          first_name: 'Visiteur',
          access_token: token,
          secret_code: code.toUpperCase(),
          week_start: weekStart,
        });

      if (insertError) {
        console.error('Error inserting access:', insertError);
        return false;
      }

      // Store token AND timestamp for 30-min session tracking
      localStorage.setItem('secret_access_token', token);
      localStorage.setItem('secret_access_timestamp', Date.now().toString());
      
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

  // Admin bypass: verify admin password and grant permanent access
  const verifyAdminAccess = async (adminPassword: string): Promise<boolean> => {
    try {
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${SUPABASE_URL}/functions/v1/admin-scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'stats', adminPassword }),
      });

      if (response.ok) {
        // Admin password valid - grant permanent access
        localStorage.setItem(ADMIN_ACCESS_KEY, 'true');
        setState({
          hasAccess: true,
          isLoading: false,
          accessToken: 'admin',
          secretCode: 'ADMIN',
          isAdminAccess: true,
        });
        return true;
      }
      return false;
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

      // Always generate a new token for fresh 30-min session
      const token = crypto.randomUUID();

      const { error } = await supabase
        .from('secret_access')
        .insert({
          email,
          phone,
          first_name: firstName,
          access_token: token,
          secret_code: secretCode,
          week_start: weekStart,
        });

      if (error) {
        console.error('Error granting access:', error);
        return null;
      }

      // Store token AND timestamp
      localStorage.setItem('secret_access_token', token);
      localStorage.setItem('secret_access_timestamp', Date.now().toString());
      
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
