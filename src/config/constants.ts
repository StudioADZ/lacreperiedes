/**
 * Clés storage centralisées (valeurs identiques => comportement identique).
 */
export const STORAGE_KEYS = {
  adminAuth: 'admin_auth',
  adminSecretMenuAccess: 'admin_secret_menu_access',
  secretAccessToken: 'secret_access_token',
  secretAccessTimestamp: 'secret_access_timestamp',
} as const;

/** Durée observée dans le projet : 30 minutes */
export const SECRET_ACCESS_SESSION_DURATION_MS = 30 * 60 * 1000;
