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

// localStorage keys
const ADMIN_ACCESS_KEY = 'admin_secret_menu_access';
const TOKEN_KEY = 'secret_access_token';
const TS_KEY = 'secret_access_timestamp';
const CODE_KEY = 'secret_access_code'; // optional: keep last working code

export const useSecretAccess = () => {
  const [state, setState] = useState<SecretAccessState>({
    hasAccess: false,
    isLoading: true,
    accessToken: null,
    secretCode: null,
    isAdminAccess: false,
  });

  useEffect(() => {
    void checkAccess();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clearLocalStorage = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TS_KEY);
    localStorage.removeItem(CODE_KEY);
  };

  const checkAccess = async () => {
    // 1) Admin permanent access
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

    // 2) Check local session window
    const storedToken = localStorage.getItem(TOKEN_KEY);
    const storedTimestamp = localStorage.getItem(TS_KEY);

    if (storedTimestamp) {
      const ts = Number(storedTimestamp);
      if (!Number.isFinite(ts) || Date.now() - ts > SESSION_DURATION_MS) {
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
      // ✅ IMPORTANT: avec tes RLS, on ne lit plus secret_access directement
      const { data: isValid, error } = await supabase.rpc('verify_secret_access', {
        p_token: storedToken,
      });

      if (error || !isValid) {
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

      // Sliding window refresh
      localStorage.setItem(TS_KEY, Date.now().toString());

      setState({
        hasAccess: true,
        isLoading: false,
        accessToken: storedToken,
        secretCode: localStorage.getItem(CODE_KEY),
        isAdminAccess: false,
      });
    } catch (e) {
      console.error('Error checking secret access:', e);
      clearLocalStorage();
      setState({
        hasAccess: false,
        isLoading: false,
        accessToken: null,
        secretCode: null,
        isAdminAccess: false,
      });
    }
  };

  const verifyCode = async (code: string): Promise<boolean> => {
    try {
      const cleanCode = (code || '').trim().toUpperCase();
      if (!cleanCode) return false;

      // 1) Get active secret code from DB (read-only)
      // NOTE: if tu as masqué secret_code via une vue uniquement, adapte cette requête
      const { data: menu, error: menuError } = await supabase
        .from('secret_menu')
        .select('secret_code')
        .eq('is_active', true)
        .order('week_start', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (menuError || !menu?.secret_code) return false;

      // 2) Compare code
      if (menu.secret_code.toUpperCase() !== cleanCode) {
        return false;
      }

      // 3) ✅ Grant access via RPC (pas d'INSERT direct => compatible RLS)
      const weekStart = getWeekStart();

      const { data: token, error: tokenError } = await supabase.rpc('grant_secret_access', {
        p_email: 'anonymous@menu-secret.local',
        p_phone: '0000000000',
        p_first_name: 'Visiteur',
        p_secret_code: cleanCode,
        p_week_start: weekStart,
      });

      if (tokenError || !token) return false;

      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(TS_KEY, Date.now().toString());
      localStorage.setItem(CODE_KEY, cleanCode);

      setState({
        hasAccess: true,
        isLoading: false,
        accessToken: token,
        secretCode: cleanCode,
        isAdminAccess: false,
      });

      return true;
    } catch (e) {
      console.error('Error verifying code:', e);
      return false;
    }
  };

  const verifyAdminAccess = async (adminPassword: string): Promise<boolean> => {
    try {
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${SUPABASE_URL}/functions/v1/admin-scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'stats', adminPassword }),
      });

      if (response.ok) {
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
    } catch (e) {
      console.error('Error verifying admin access:', e);
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
      const cleanCode = (secretCode || '').trim().toUpperCase();

      // ✅ via RPC
      const { data: token, error } = await supabase.rpc('grant_secret_access', {
        p_email: email,
        p_phone: phone,
        p_first_name: firstName,
        p_secret_code: cleanCode,
        p_week_start: weekStart,
      });

      if (error || !token) return null;

      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(TS_KEY, Date.now().toString());
      localStorage.setItem(CODE_KEY, cleanCode);

      setState({
        hasAccess: true,
        isLoading: false,
        accessToken: token,
        secretCode: cleanCode,
        isAdminAccess: false,
      });

      return token;
    } catch (e) {
      console.error('Error granting access from quiz:', e);
      return null;
    }
  };

  const revokeAccess = () => {
    clearLocalStorage();
    localStorage.removeItem(ADMIN_ACCESS_KEY);
    setState({
      hasAccess: false,
      isLoading: false,
      accessToken: null,
      secretCode: null,
      isAdminAccess: false,
    });
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
