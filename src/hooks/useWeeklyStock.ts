import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface WeeklyStock {
  formule_complete_remaining: number;
  formule_complete_total: number;
  galette_remaining: number;
  galette_total: number;
  crepe_remaining: number;
  crepe_total: number;
  week_start: string;
  isFallback?: boolean;
}

const FALLBACK_STOCK: WeeklyStock = {
  formule_complete_remaining: 10,
  formule_complete_total: 10,
  galette_remaining: 20,
  galette_total: 20,
  crepe_remaining: 30,
  crepe_total: 30,
  week_start: new Date().toISOString().slice(0, 10),
  isFallback: true,
};

function normalizeStock(data: Partial<WeeklyStock> | null | undefined): WeeklyStock {
  return {
    formule_complete_remaining: Number(data?.formule_complete_remaining ?? FALLBACK_STOCK.formule_complete_remaining),
    formule_complete_total: Number(data?.formule_complete_total ?? FALLBACK_STOCK.formule_complete_total),
    galette_remaining: Number(data?.galette_remaining ?? FALLBACK_STOCK.galette_remaining),
    galette_total: Number(data?.galette_total ?? FALLBACK_STOCK.galette_total),
    crepe_remaining: Number(data?.crepe_remaining ?? FALLBACK_STOCK.crepe_remaining),
    crepe_total: Number(data?.crepe_total ?? FALLBACK_STOCK.crepe_total),
    week_start: data?.week_start ?? FALLBACK_STOCK.week_start,
    isFallback: data?.isFallback ?? false,
  };
}

export const useWeeklyStock = () => {
  return useQuery({
    queryKey: ['weekly-stock'],
    queryFn: async () => {
      try {
        const { error: ensureError } = await supabase.rpc('ensure_weekly_stock');
        if (ensureError) throw ensureError;

        const { data: weekStart, error: weekError } = await supabase.rpc('get_current_week_start');
        if (weekError || !weekStart) throw weekError ?? new Error('Current week unavailable');

        const { data, error } = await supabase
          .from('weekly_stock')
          .select('*')
          .eq('week_start', weekStart)
          .maybeSingle();

        if (error) throw error;
        return normalizeStock(data);
      } catch (error) {
        console.warn('[quiz] weekly stock unavailable, using safe display fallback:', error);
        return FALLBACK_STOCK;
      }
    },
    initialData: FALLBACK_STOCK,
    refetchInterval: 30000,
    retry: 1,
  });
};
