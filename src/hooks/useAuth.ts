import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

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
  isAdmin: boolean;
}

export const useAuth = () => {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    profile: null,
    isLoading: true,
    isAuthenticated: false,
    isAdmin: false,
  });

  // Prevent stale async updates from overwriting fresh auth state
  const requestIdRef = useRef(0);
  const mountedRef = useRef(true);

  const checkAdminRole = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle();

      if (error) throw error;
      return !!data;
    } catch (error) {
      console.error("Error checking admin role:", error);
      return false;
    }
  }, []);

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle();
      if (error) throw error;
      return (data as Profile) ?? null;
    } catch (error) {
      console.error("Error fetching profile:", error);
      return null;
    }
  }, []);

  const applySession = useCallback(
    async (session: Session | null) => {
      const currentRequestId = ++requestIdRef.current;

      const user = session?.user ?? null;

      // Base state first (fast, no async)
      setState((prev) => ({
        ...prev,
        user,
        session,
        isLoading: false,
        isAuthenticated: !!user,
        // keep previous profile/isAdmin while loading enrichment to avoid flicker
        ...(user ? {} : { profile: null, isAdmin: false }),
      }));

      if (!user) return;

      // Enrich in parallel
      const [profile, isAdmin] = await Promise.all([fetchProfile(user.id), checkAdminRole(user.id)]);

      // Ignore if component unmounted or newer auth event already happened
      if (!mountedRef.current) return;
      if (currentRequestId !== requestIdRef.current) return;

      setState((prev) => ({
        ...prev,
        profile,
        isAdmin,
      }));
    },
    [fetchProfile, checkAdminRole],
  );

  useEffect(() => {
    mountedRef.current = true;

    // Listen to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      await applySession(session);
    });

    // Hydrate existing session
    supabase.auth
      .getSession()
      .then(async ({ data: { session } }) => {
        await applySession(session);
      })
      .catch(() => {
        // Even if getSession fails, we should stop loading
        if (!mountedRef.current) return;
        setState((prev) => ({ ...prev, isLoading: false }));
      });

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
    };
  }, [applySession]);

  const signUp = async (email: string, password: string, firstName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { first_name: firstName },
      },
    });

    if (error) throw error;
    return data;
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  };

  const signInWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });

    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;

    // Reset immediately (listener will also receive the event; requestId guard prevents stale overwrites)
    requestIdRef.current++;
    setState({
      user: null,
      session: null,
      profile: null,
      isLoading: false,
      isAuthenticated: false,
      isAdmin: false,
    });
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!state.user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("user_id", state.user.id)
      .select()
      .single();

    if (error) throw error;

    setState((prev) => ({ ...prev, profile: data as Profile }));
    return data;
  };

  const refreshProfile = useCallback(async () => {
    if (!state.user) return;

    const currentRequestId = ++requestIdRef.current;
    const profile = await fetchProfile(state.user.id);

    if (!mountedRef.current) return;
    if (currentRequestId !== requestIdRef.current) return;

    setState((prev) => ({ ...prev, profile }));
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
