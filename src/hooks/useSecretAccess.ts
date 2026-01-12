import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SecretAccessState {
  hasAccess: boolean;
  isLoading: boolean;
  accessToken: string | null;
  secretCode: string | null;
}

export const useSecretAccess = () => {
  const [state, setState] = useState<SecretAccessState>({
    hasAccess: false,
    isLoading: true,
    accessToken: null,
    secretCode: null,
  });

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    const storedToken = localStorage.getItem('secret_access_token');
    
    if (!storedToken) {
      setState({ hasAccess: false, isLoading: false, accessToken: null, secretCode: null });
      return;
    }

    try {
      // Verify token is still valid
      const { data, error } = await supabase
        .from('secret_access')
        .select('access_token, secret_code, expires_at')
        .eq('access_token', storedToken)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      if (error || !data) {
        // Token expired or invalid
        localStorage.removeItem('secret_access_token');
        setState({ hasAccess: false, isLoading: false, accessToken: null, secretCode: null });
        return;
      }

      setState({
        hasAccess: true,
        isLoading: false,
        accessToken: data.access_token,
        secretCode: data.secret_code,
      });
    } catch (error) {
      console.error('Error checking secret access:', error);
      setState({ hasAccess: false, isLoading: false, accessToken: null, secretCode: null });
    }
  };

  const verifyCode = async (code: string): Promise<boolean> => {
    try {
      // Get the current secret menu code
      const { data: menu } = await supabase
        .from('secret_menu')
        .select('secret_code')
        .eq('is_active', true)
        .order('week_start', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!menu) return false;

      // Check if code matches (case insensitive)
      if (menu.secret_code.toUpperCase() === code.toUpperCase()) {
        // Check if user already has a valid token for this code
        const storedToken = localStorage.getItem('secret_access_token');
        
        if (storedToken) {
          const { data: existingAccess } = await supabase
            .from('secret_access')
            .select('access_token, expires_at')
            .eq('access_token', storedToken)
            .gt('expires_at', new Date().toISOString())
            .maybeSingle();

          if (existingAccess) {
            setState({
              hasAccess: true,
              isLoading: false,
              accessToken: existingAccess.access_token,
              secretCode: code.toUpperCase(),
            });
            return true;
          }
        }

        // Generate new token client-side for anonymous access
        const token = crypto.randomUUID();
        const weekStart = getWeekStart();

        const { error } = await supabase
          .from('secret_access')
          .insert({
            email: 'anonymous@menu-secret.local',
            phone: '0000000000',
            first_name: 'Visiteur',
            access_token: token,
            secret_code: code.toUpperCase(),
            week_start: weekStart,
          });

        if (error) {
          console.error('Error inserting access:', error);
          return false;
        }

        localStorage.setItem('secret_access_token', token);
        setState({
          hasAccess: true,
          isLoading: false,
          accessToken: token,
          secretCode: code.toUpperCase(),
        });
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error verifying code:', error);
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

      // Check if already has access this week
      const { data: existing } = await supabase
        .from('secret_access')
        .select('access_token')
        .eq('email', email)
        .eq('week_start', weekStart)
        .maybeSingle();

      if (existing) {
        localStorage.setItem('secret_access_token', existing.access_token);
        setState({
          hasAccess: true,
          isLoading: false,
          accessToken: existing.access_token,
          secretCode,
        });
        return existing.access_token;
      }

      // Generate new token
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

      localStorage.setItem('secret_access_token', token);
      setState({
        hasAccess: true,
        isLoading: false,
        accessToken: token,
        secretCode,
      });
      return token;
    } catch (error) {
      console.error('Error granting access:', error);
      return null;
    }
  };

  const revokeAccess = () => {
    localStorage.removeItem('secret_access_token');
    setState({ hasAccess: false, isLoading: false, accessToken: null, secretCode: null });
  };

  return {
    ...state,
    verifyCode,
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
