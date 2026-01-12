// Shared validation utilities for edge functions

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Email validation
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email) && email.length <= 100
}

// Phone validation (French format: 10 digits, may start with +33)
export function isValidPhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s.-]/g, '')
  // Accept +33 format or 10 digits starting with 0
  const frenchPhoneRegex = /^(\+33[1-9][0-9]{8}|0[1-9][0-9]{8})$/
  return frenchPhoneRegex.test(cleaned)
}

// Name validation (alphanumeric + spaces, hyphens, apostrophes)
export function isValidName(name: string): boolean {
  if (!name || name.length < 1 || name.length > 50) return false
  // Allow letters (including accented), spaces, hyphens, apostrophes
  const nameRegex = /^[a-zA-ZÀ-ÿ\s\-']+$/
  return nameRegex.test(name)
}

// Device fingerprint validation
export function isValidFingerprint(fp: string): boolean {
  if (!fp || typeof fp !== 'string') return false
  return fp.length >= 5 && fp.length <= 50 && /^[a-zA-Z0-9_-]+$/.test(fp)
}

// Sanitize user input for logging (remove sensitive data)
export function sanitizeForLog(obj: Record<string, unknown>): Record<string, unknown> {
  const sensitiveFields = ['email', 'phone', 'password', 'adminPassword', 'access_token']
  const sanitized: Record<string, unknown> = {}
  for (const key in obj) {
    if (sensitiveFields.includes(key)) {
      sanitized[key] = '[REDACTED]'
    } else {
      sanitized[key] = obj[key]
    }
  }
  return sanitized
}

// Generic error response (no internal details exposed)
export function errorResponse(
  code: string, 
  message: string, 
  status: number = 400
): Response {
  return new Response(
    JSON.stringify({ error: code, message }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status }
  )
}

// Success response
export function successResponse(data: unknown): Response {
  return new Response(
    JSON.stringify(data),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

// Server error (hides internal details)
export function serverErrorResponse(): Response {
  return new Response(
    JSON.stringify({ error: 'server_error', message: 'Une erreur est survenue' }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
  )
}

// Prize code validation
export function isValidPrizeCode(code: string): boolean {
  // Prize codes are 6-10 chars alphanumeric
  if (!code || typeof code !== 'string') return false
  return /^[A-Z0-9]{6,10}$/.test(code.toUpperCase())
}

// Access token validation
export function isValidAccessToken(token: string): boolean {
  // Access tokens are 20-40 chars alphanumeric
  if (!token || typeof token !== 'string') return false
  return /^[a-zA-Z0-9]{20,40}$/.test(token)
}