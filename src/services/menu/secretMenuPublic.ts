import { supabase } from "@/integrations/supabase/client";
import type { SecretMenuPublicData } from "@/types/menu";
import type { ServiceResult } from "./cartePublic";

export async function fetchActiveSecretMenuPublic(): Promise<ServiceResult<SecretMenuPublicData>> {
  try {
    const { data, error } = await supabase
      .from("secret_menu_public")
      .select("*")
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();

    if (error) return { ok: false, error: error.message };
    if (!data) return { ok: false, error: "Aucun menu secret actif" };

    return { ok: true, data: data as any };
  } catch (e: any) {
    return { ok: false, error: e?.message || "Erreur inconnue" };
  }
}
