/**
 * Centralise l'accès aux variables Vite.
 * Non destructif : on lit exactement les mêmes variables que l'app utilise déjà.
 */
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const EDGE_FUNCTIONS_BASE_URL = SUPABASE_URL
  ? `${SUPABASE_URL}/functions/v1`
  : undefined;

if (import.meta.env.DEV) {
  if (!SUPABASE_URL) console.warn('[env] VITE_SUPABASE_URL manquant');
  if (!SUPABASE_ANON_KEY) console.warn('[env] VITE_SUPABASE_ANON_KEY manquant');
}
