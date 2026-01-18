// SAFE WRAPPER (non auto-généré) : ne sera pas écrasé par la génération Supabase
import type { Database, Tables, TablesInsert, TablesUpdate, Enums } from "@/integrations/supabase/types";

// Alias pratiques
export type DB = Database;

// Rows
export type Row<
  T extends keyof (Database["public"]["Tables"] & Database["public"]["Views"])
> = Tables<T>;

// Inserts / Updates (tables uniquement)
export type Insert<
  T extends keyof Database["public"]["Tables"]
> = TablesInsert<T>;

export type Update<
  T extends keyof Database["public"]["Tables"]
> = TablesUpdate<T>;

// Enums
export type AppRole = Enums<"app_role">;

// Helpers ciblés (optionnel)
export type ProfileRow = Row<"profiles">;
export type ProfileInsert = Insert<"profiles">;
export type ProfileUpdate = Update<"profiles">;
