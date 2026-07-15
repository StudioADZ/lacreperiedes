import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import {
  corsHeaders,
  isValidPrizeCode,
  errorResponse,
  successResponse,
  serverErrorResponse,
} from '../_shared/validation.ts'

const PARIS_TIME_ZONE = 'Europe/Paris'
const EXPIRY_HOUR = 22

const getExpiryDateKey = (weekStart: string): string | null => {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(weekStart)
  if (!match) return null

  const mondayUtc = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])))
  if (Number.isNaN(mondayUtc.getTime())) return null

  mondayUtc.setUTCDate(mondayUtc.getUTCDate() + 6)
  return mondayUtc.toISOString().slice(0, 10)
}

const getParisNow = () => {
  const parts = new Intl.DateTimeFormat('fr-FR', {
    timeZone: PARIS_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date())

  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  return {
    dateKey: `${values.year}-${values.month}-${values.day}`,
    hour: Number(values.hour),
    minute: Number(values.minute),
  }
}

const isPrizeExpired = (weekStart: string): boolean => {
  const expiryDateKey = getExpiryDateKey(weekStart)
  if (!expiryDateKey) return true

  const now = getParisNow()
  if (now.dateKey > expiryDateKey) return true
  if (now.dateKey < expiryDateKey) return false

  return now.hour > EXPIRY_HOUR || (now.hour === EXPIRY_HOUR && now.minute >= 0)
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  if (req.method !== 'POST') return errorResponse('method_not_allowed', 'Méthode non autorisée', 405)

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!supabaseUrl || !supabaseServiceKey) return serverErrorResponse()

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const payload = await req.json().catch(() => null)
    const code = typeof payload?.code === 'string' ? payload.code.trim().toUpperCase() : ''

    if (!code) return errorResponse('missing_code', 'Code requis')
    if (!isValidPrizeCode(code)) return errorResponse('invalid_code', 'Format de code invalide')

    const { data: participation, error } = await supabase
      .from('quiz_participations')
      .select('first_name, prize_won, week_start, prize_claimed, claimed_at')
      .eq('prize_code', code)
      .maybeSingle()

    if (error) {
      console.error('Prize lookup error')
      return serverErrorResponse()
    }

    if (!participation) {
      return successResponse({ valid: false, status: 'not_found', message: 'Code non trouvé' })
    }

    if (!participation.week_start || isPrizeExpired(participation.week_start)) {
      return successResponse({
        valid: false,
        status: 'expired',
        message: 'Code expiré : les récompenses doivent être utilisées avant le dimanche à 22h00',
      })
    }

    if (participation.prize_claimed) {
      return successResponse({
        valid: false,
        status: 'already_claimed',
        message: 'Code déjà utilisé',
        firstName: participation.first_name,
        prize: participation.prize_won,
        claimed: true,
        claimedAt: participation.claimed_at,
      })
    }

    const weekDate = new Date(`${participation.week_start}T00:00:00Z`)
    const startOfYear = new Date(Date.UTC(weekDate.getUTCFullYear(), 0, 1))
    const weekNumber = Math.ceil(((weekDate.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getUTCDay() + 1) / 7)

    return successResponse({
      valid: true,
      status: 'valid',
      firstName: participation.first_name,
      prize: participation.prize_won,
      weekNumber,
      claimed: false,
      claimedAt: null,
      expires: 'Dimanche 22h00, heure de Paris',
    })
  } catch (error: unknown) {
    console.error('Verify prize error:', error instanceof Error ? error.message : 'Unknown')
    return serverErrorResponse()
  }
})
