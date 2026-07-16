import { useSecretAccess } from "@/hooks/useSecretAccess";
import { supabase } from "@/integrations/supabase/client";

export const useWeeklyOfferAccess = () => {
  const base = useSecretAccess();

  const verifyCode = async (code: string): Promise<boolean> => {
    const normalized = code.trim().toUpperCase();
    if (!normalized) return false;

    const { data: validPersonalCode, error } = await supabase.rpc("validate_weekly_offer_code", { p_code: normalized });
    if (!error && validPersonalCode === true) {
      const token = await base.grantAccessFromQuiz(
        "weekly-offer@access.local",
        "0000000000",
        "Participant quiz",
        normalized,
      );
      return Boolean(token);
    }

    return base.verifyCode(normalized);
  };

  return { ...base, verifyCode };
};
