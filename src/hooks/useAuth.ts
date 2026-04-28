// Backwards-compatible wrapper.
// The real implementation lives in src/services/auth/AuthProvider.tsx.
export { useAuthContext as useAuth } from "@/services/auth/AuthProvider";
export type { Profile, AuthState } from "@/services/auth/AuthProvider";
