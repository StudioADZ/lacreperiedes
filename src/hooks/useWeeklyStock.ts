import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface WeeklyStock {
  formule_complete_remaining: number;
  formule_complete_total: number;
  galette_remaining: number;
  galette_total: number;
  crepe_remaining: number;
  crepe_total: number;
  week_start: string;
}

function normalizeWeekStart(value: unknown): string {
  // Supabase RPC can return string or object depending on SQL / wrapper
  // We enforce string to avoid silent .eq mismatch.
  if (typeof value === "string" && value.trim()) return value;

  // Common pattern: RPC returns { week_start: "YYYY-MM-DD" }
  if (value && typeof value === "object" && "week_start" in value) {
    const ws = (value as any).week_start;
    if (typeof ws === "string" && ws.trim()) return ws;
  }

  throw new Error("Invalid week_start returned by get_current_week_start()");
}

export const useWeeklyStock = () => {
  return useQuery({
    queryKey: ["weekly-stock"],
    queryFn: async () => {
      // 1) Get current week start (must be valid)
      const { data: weekStartRaw, error: weekStartError } = await supabase.rpc("get_current_week_start");
      if (weekStartError) throw weekStartError;

      const weekStart = normalizeWeekStart(weekStartRaw);

      // 2) Try to fetch stock first (no side-effect yet)
      const { data: existing, error: fetchError } = await supabase
        .from("weekly_stock")
        .select("*")
        .eq("week_start", weekStart)
        .maybeSingle();

      if (fetchError) throw fetchError;

      // 3) If missing, ensure and fetch again (controlled side-effect)
      if (!existing) {
        const { error: ensureError } = await supabase.rpc("ensure_weekly_stock");
        if (ensureError) throw ensureError;

        const { data, error } = await supabase
          .from("weekly_stock")
          .select("*")
          .eq("week_start", weekStart)
          .single();

        if (error) throw error;
        return data as WeeklyStock;
      }

      return existing as WeeklyStock;
    },

    // Keep your live feel, but reduce noisy refetches
    refetchInterval: 30000,
    refetchIntervalInBackground: false,

    // Optional safe defaults (won't break anything)
    staleTime: 10_000,
    retry: (failureCount, error: any) => {
      // Avoid infinite loops on permission/RLS errors
      const msg = String(error?.message || "");
      if (msg.toLowerCase().includes("permission") || msg.toLowerCase().includes("rls")) return false;
      return failureCount < 2;
    },
  });
};
