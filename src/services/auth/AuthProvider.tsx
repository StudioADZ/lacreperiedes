import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
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
  signInWithApple: () => Promise<unknown>;
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

const SIGNED_OUT_STATE: AuthState = {
  user: null,
  session: null,
  profile: null,
  isLoading: false,
  isAuthenticated: false,
};

const getAuthRedirectUrl = () => {
  if (typeof window === "undefined") return undefined;
  return `${window.location.origin}/client`;
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
  const authRequestRef = useRef(0);

  const applySession = useCallback(async (session: Session | null) => {
    const requestId = ++authRequestRef.current;
    const user = session?.user ?? null;

    if (!user) {
      if (!mountedRef.current || requestId !== authRequestRef.current) return;
      setState(SIGNED_OUT_STATE);
      return;
    }

    setState((prev) => {
      const sameUser = prev.user?.id === user.id;
      const profile = sameUser ? prev.profile : null;

      return {
        user,
        session,
        profile,
        isAuthenticated: true,
        isLoading: !profile,
      };
    });

    const profile = await fetchProfileById(user.id);
    if (!mountedRef.current || requestId !== authRequestRef.current) return;

    setState({
      user,
      session,
      profile,
      isLoading: false,
      isAuthenticated: true,
    });
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      void applySession(session);
    });

    void (async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.error("[auth] getSession error:", error);
        if (mountedRef.current) setState(SIGNED_OUT_STATE);
        return;
      }

      await applySession(session);
    })();

    return () => {
      mountedRef.current = false;
      authRequestRef.current += 1;
      subscription.unsubscribe();
    };
  }, [applySession]);

  const signUp = useCallback(
    async (email: string, password: string, firstName: string) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: getAuthRedirectUrl(),
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
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: getAuthRedirectUrl(),
      extraParams: { prompt: "select_account" },
    });
    if (result.error) throw result.error;
    return result;
  }, []);

  const signInWithApple = useCallback(async () => {
    const result = await lovable.auth.signInWithOAuth("apple", {
      redirect_uri: getAuthRedirectUrl(),
    });
    if (result.error) throw result.error;
    return result;
  }, []);

  const signOut = useCallback(async () => {
    authRequestRef.current += 1;
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    if (mountedRef.current) setState(SIGNED_OUT_STATE);
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
    const requestId = authRequestRef.current;
    const profile = await fetchProfileById(state.user.id);
    if (!mountedRef.current || requestId !== authRequestRef.current) return;
    setState((prev) => ({ ...prev, profile }));
  }, [state.user]);

  const value: AuthContextValue = useMemo(
    () => ({
      ...state,
      signUp,
      signIn,
      signInWithGoogle,
      signInWithApple,
      signOut,
      updateProfile,
      refreshProfile,
    }),
    [
      state,
      signUp,
      signIn,
      signInWithGoogle,
      signInWithApple,
      signOut,
      updateProfile,
      refreshProfile,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuthContext must be used within an <AuthProvider>");
  }
  return ctx;
};
