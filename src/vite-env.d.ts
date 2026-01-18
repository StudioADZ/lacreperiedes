/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string;

  // Si tu as aussi (vu plus haut dans ton code) :
  readonly VITE_SUPABASE_KEY?: string; // (si utilisé quelque part)
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
