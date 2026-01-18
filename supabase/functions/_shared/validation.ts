// Shared validation utilities for edge functions

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
} as const;

// Optional: extended CORS headers (does not replace existing corsHeaders)
export const corsHeadersWithMethods = {
  ...corsHeaders,
  "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
} as const;

/**
 * Optional helper: respond to CORS preflight quickly.
 * Use in edge functions:
 *   if (req.method === "OPTIONS") return handleCorsOptions();
 */
export function handleCorsOptions(): Response {
  return new Response(null, { headers: corsHeadersWithMethods, status: 204 });
}

// Email validation
export function isValidEmail(email: string): boolean {
  if (typeof email !== "string") return false;
  const trimmed = email.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(trimmed) && trimmed.length <= 100;
}

// Phone validation (French format: 10 digits, may start with +33)
export function isValidPhone(phone: string): boolean {
  if (typeof phone !== "string") return false;
  // Normalize common separators + parentheses
  const cleaned = phone.replace(/[\s.\-()]/g, "");
  // Accept +33 format or 10 digits starting with 0
  const frenchPhoneRegex = /^(\+33[1-9][0-9]{8}|0[1-9][0-9]{8})$/;
  return frenchPhoneRegex.test(cleaned);
}

// Name validation (alphanumeric + spaces, hyphens, apostrophes)
export function isValidName(name: string): boolean {
  if (!name || typeof name !== "string") return false;
  const trimmed = name.trim();
  if (trimmed.length < 1 || trimmed.length > 50) return false;

  // Allow letters (including accented), spaces, hyphens, apostrophes
  const nameRegex = /^[a-zA-ZÀ-ÿ\s\-']+$/;
  if (!nameRegex.test(trimmed)) return false;

  // Ensure at least one letter (prevents "--" or "''" only)
  const hasLetter = /[a-zA-ZÀ-ÿ]/.test(trimmed);
  return hasLetter;
}

// Device fingerprint validation
export function isValidFingerprint(fp: string): boolean {
  if (!fp || typeof fp !== "string") return false;
  return fp.length >= 5 && fp.length <= 50 && /^[a-zA-Z0-9_-]+$/.test(fp);
}

// Sanitize user input for logging (remove sensitive data)
const DEFAULT_SENSITIVE_FIELDS = new Set([
  "email",
  "phone",
  "password",
  "adminPassword",
  "access_token",
  // common variants
  "accessToken",
  "token",
  "authorization",
  "apikey",
]);

/**
 * SAFE: keeps the original behavior (1-level object), just broader key coverage.
 */
export function sanitizeForLog(obj: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};
  for (const key in obj) {
    if (DEFAULT_SENSITIVE_FIELDS.has(key)) {
      sanitized[key] = "[REDACTED]";
    } else {
      sanitized[key] = obj[key];
    }
  }
  return sanitized;
}

/**
 * Optional: deep sanitization for nested objects/arrays.
 * Doesn’t replace sanitizeForLog; you opt-in.
 */
export function sanitizeForLogDeep(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sanitizeForLogDeep);
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = DEFAULT_SENSITIVE_FIELDS.has(k) ? "[REDACTED]" : sanitizeForLogDeep(v);
    }
    return out;
  }
  return value;
}

// Generic error response (no internal details exposed)
export function errorResponse(code: string, message: string, status: number = 400): Response {
  return new Response(JSON.stringify({ error: code, message }), {
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
    status,
  });
}

// Success response
export function successResponse(data: unknown): Response {
  return new Response(JSON.stringify(data), {
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

// Server error (hides internal details)
export function serverErrorResponse(): Response {
  return new Response(JSON.stringify({ error: "server_error", message: "Une erreur est survenue" }), {
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
    status: 500,
  });
}

// Prize code validation
export function isValidPrizeCode(code: string): boolean {
  if (!code || typeof code !== "string") return false;
  return /^[A-Z0-9]{6,10}$/.test(code.trim().toUpperCase());
}

// Access token validation
export function isValidAccessToken(token: string): boolean {
  if (!token || typeof token !== "string") return false;
  const t = token.trim();

  // Keep original rule
  const legacy = /^[a-zA-Z0-9]{20,40}$/.test(t);

  // SAFE ADD: accept UUID v4 style (because your client code uses crypto.randomUUID())
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(t);

  return legacy || uuid;
}
