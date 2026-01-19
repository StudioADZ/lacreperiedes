import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

interface Profile {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  city: string | null;
  avatar_url: string | null;
  loyalty_points: number;
  total_visits: number;
  secret_menu_unlocked: boolean;
  secret_menu_code: string | null;
  secret_menu_unlocked_at: string | null;
}

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export const useAuth = () => {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    profile: null,
    isLoading: true,
    isAuthenticated: false,
  });

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      return data as Profile | null;
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  }, []);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const user = session?.user ?? null;
        let profile: Profile | null = null;

        if (user) {
          // Defer profile fetch to avoid blocking
          setTimeout(async () => {
            profile = await fetchProfile(user.id);
            setState(prev => ({ ...prev, profile }));
          }, 0);
        }

        setState({
          user,
          session,
          profile,
          isLoading: false,
          isAuthenticated: !!user,
        });
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      const user = session?.user ?? null;
      
      if (user) {
        fetchProfile(user.id).then(profile => {
          setState({
            user,
            session,
            profile,
            isLoading: false,
            isAuthenticated: true,
          });
        });
      } else {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signUp = async (email: string, password: string, firstName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          first_name: firstName,
        },
      },
    });
    
    if (error) throw error;
    return data;
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) throw error;
    return data;
  };

  const signInWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
    
    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    
    setState({
      user: null,
      session: null,
      profile: null,
      isLoading: false,
      isAuthenticated: false,
    });
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!state.user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('user_id', state.user.id)
      .select()
      .single();

    if (error) throw error;
    
    setState(prev => ({ ...prev, profile: data as Profile }));
    return data;
  };

  const refreshProfile = useCallback(async () => {
    if (!state.user) return;
    const profile = await fetchProfile(state.user.id);
    setState(prev => ({ ...prev, profile }));
  }, [state.user, fetchProfile]);

  return {
    ...state,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    updateProfile,
    refreshProfile,
  };
};
