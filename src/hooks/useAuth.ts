/**
 * Backwards-compatible auth hook entrypoint.
 *
 * The canonical implementation lives in `src/services/auth/AuthProvider.tsx`.
 * Keep this file tiny so older imports from `@/hooks/useAuth` continue to work
 * while new code can import from the provider directly when needed.
 */
export {
  useAuthContext,
  useAuthContext as useAuth,
} from "@/services/auth/AuthProvider";

export type { AuthState, Profile } from "@/services/auth/AuthProvider";
