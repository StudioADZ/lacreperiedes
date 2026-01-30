import { supabase } from "@/integrations/supabase/client";
import type { CartePublicData } from "@/types/menu";

export type ServiceResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export async function fetchActiveCartePublic(): Promise<ServiceResult<CartePublicData>> {
  try {
    const { data, error } = await supabase
      .from("carte_public")
      .select("galette_items, crepe_items")
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();

    if (error) return { ok: false, error: error.message };
    if (!data) return { ok: false, error: "Aucune carte active" };

    return {
      ok: true,
      data: {
        galette_items: Array.isArray(data.galette_items) ? (data.galette_items as any) : [],
        crepe_items: Array.isArray(data.crepe_items) ? (data.crepe_items as any) : [],
      },
    };
  } catch (e: any) {
    return { ok: false, error: e?.message || "Erreur inconnue" };
  }
}
