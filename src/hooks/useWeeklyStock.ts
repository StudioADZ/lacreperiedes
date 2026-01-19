import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface WeeklyStock {
  formule_complete_remaining: number;
  formule_complete_total: number;
  galette_remaining: number;
  galette_total: number;
  crepe_remaining: number;
  crepe_total: number;
  week_start: string;
}

export const useWeeklyStock = () => {
  return useQuery({
    queryKey: ['weekly-stock'],
    queryFn: async () => {
      // First ensure stock exists for this week
      await supabase.rpc('ensure_weekly_stock');

      // Get current week start
      const { data: weekStart } = await supabase.rpc('get_current_week_start');

      // Fetch stock
      const { data, error } = await supabase
        .from('weekly_stock')
        .select('*')
        .eq('week_start', weekStart)
        .single();

      if (error) throw error;
      return data as WeeklyStock;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};