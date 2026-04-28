import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

export interface Profile {
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

export interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextValue extends AuthState {
  signUp: (email: string, password: string, firstName: string) => Promise<unknown>;
  signIn: (email: string, password: string) => Promise<unknown>;
  signInWithGoogle: () => Promise<unknown>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<Profile>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const INITIAL_STATE: AuthState = {
  user: null,
  session: null,
  profile: null,
  isLoading: true,
  isAuthenticated: false,
};

async function fetchProfileById(userId: string): Promise<Profile | null> {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw error;
    return (data as Profile | null) ?? null;
  } catch (error) {
    console.error("[auth] fetchProfile error:", error);
    return null;
  }
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<AuthState>(INITIAL_STATE);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mountedRef.current) return;
      const user = session?.user ?? null;

      setState((prev) => ({
        ...prev,
        user,
        session,
        isAuthenticated: !!user,
        profile: user ? prev.profile : null,
        isLoading: prev.isLoading && !user ? false : prev.isLoading,
      }));

      if (user) {
        void (async () => {
          const profile = await fetchProfileById(user.id);
          if (!mountedRef.current) return;
          setState((prev) => ({ ...prev, profile, isLoading: false }));
        })();
      } else {
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    });

    void (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const user = session?.user ?? null;

      if (!user) {
        if (!mountedRef.current) return;
        setState({
          user: null,
          session: null,
          profile: null,
          isLoading: false,
          isAuthenticated: false,
        });
        return;
      }

      const profile = await fetchProfileById(user.id);
      if (!mountedRef.current) return;
      setState({
        user,
        session,
        profile,
        isLoading: false,
        isAuthenticated: true,
      });
    })();

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = useCallback(
    async (email: string, password: string, firstName: string) => {
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
    },
    [],
  );

  const signIn = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (error) throw error;
    return data;
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setState({
      user: null,
      session: null,
      profile: null,
      isLoading: false,
      isAuthenticated: false,
    });
  }, []);

  const updateProfile = useCallback(
    async (updates: Partial<Profile>) => {
      if (!state.user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("user_id", state.user.id)
        .select()
        .single();
      if (error) throw error;
      const profile = data as Profile;
      setState((prev) => ({ ...prev, profile }));
      return profile;
    },
    [state.user],
  );

  const refreshProfile = useCallback(async () => {
    if (!state.user) return;
    const profile = await fetchProfileById(state.user.id);
    if (!mountedRef.current) return;
    setState((prev) => ({ ...prev, profile }));
  }, [state.user]);

  const value: AuthContextValue = {
    ...state,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    updateProfile,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuthContext must be used within an <AuthProvider>");
  }
  return ctx;
};
