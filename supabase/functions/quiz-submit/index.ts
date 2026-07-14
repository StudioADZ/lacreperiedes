import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import {
  corsHeaders,
  isValidPhone,
  isValidName,
  isValidFingerprint,
  errorResponse,
  successResponse,
  serverErrorResponse,
} from '../_shared/validation.ts'

const TOTAL_QUESTIONS = 10
const MAX_CODE_ATTEMPTS = 8

type PrizeType = 'formule_complete' | 'galette' | 'crepe'
type QuizAnswer = { questionIndex: number; answer: string; isCorrect: boolean }

const normalizePhone = (phone: string): string => {
  const cleaned = phone.replace(/[\s.-]/g, '')
  if (cleaned.startsWith('+33')) return cleaned
  if (cleaned.startsWith('0')) return `+33${cleaned.slice(1)}`
  return cleaned
}

const determinePrize = (percentage: number) => {
  if (percentage === 100) return { prizeType: 'formule_complete' as PrizeType, prizeLabel: 'Formule Complète' }
  if (percentage >= 90) return { prizeType: 'galette' as PrizeType, prizeLabel: 'Une Galette' }
  if (percentage >= 80) return { prizeType: 'crepe' as PrizeType, prizeLabel: 'Une Crêpe' }
  return { prizeType: null, prizeLabel: null }
}

const getStockColumn = (prizeType: PrizeType) => {
  if (prizeType === 'formule_complete') return 'formule_complete_remaining'
  if (prizeType === 'galette') return 'galette_remaining'
  return 'crepe_remaining'
}

async function readJson(req: Request): Promise<Record<string, unknown> | null> {
  try {
    const data = await req.json()
    return data && typeof data === 'object' && !Array.isArray(data) ? data as Record<string, unknown> : null
  } catch {
    return null
  }
}

async function getVerifiedUser(supabase: ReturnType<typeof createClient>, req: Request) {
  const token = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '').trim()
  if (!token) return null
  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data.user?.id || !data.user.email || !data.user.email_confirmed_at) return null
  return data.user
}

async function generateUniquePrizeCode(supabase: ReturnType<typeof createClient>): Promise<string | null> {
  for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt += 1) {
    const { data: code, error } = await supabase.rpc('generate_prize_code')
    if (error || typeof code !== 'string') return null
    const { data: existing } = await supabase
      .from('quiz_participations')
      .select('id')
      .eq('prize_code', code)
      .maybeSingle()
    if (!existing) return code
  }
  return null
}

async function refundPrizeStock(supabase: ReturnType<typeof createClient>, prizeType: PrizeType | null, weekStart: string | null) {
  if (!prizeType || !weekStart) return
  const column = getStockColumn(prizeType)
  const { data: stock } = await supabase.from('weekly_stock').select(column).eq('week_start', weekStart).maybeSingle()
  const current = Number(stock?.[column] ?? 0)
  await supabase.from('weekly_stock').update({ [column]: current + 1 }).eq('week_start', weekStart)
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  if (req.method !== 'POST') return errorResponse('method_not_allowed', 'Méthode non autorisée', 405)

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!supabaseUrl || !serviceKey) return serverErrorResponse()

    const supabase = createClient(supabaseUrl, serviceKey)
    const user = await getVerifiedUser(supabase, req)
    if (!user) {
      return errorResponse('verified_account_required', 'Un compte avec email vérifié est requis pour afficher le résultat', 401)
    }

    const body = await readJson(req)
    if (!body) return errorResponse('invalid_json', 'Requête invalide')

    const sessionId = typeof body.sessionId === 'string' ? body.sessionId.trim() : ''
    const deviceFingerprint = typeof body.deviceFingerprint === 'string' ? body.deviceFingerprint.trim() : ''
    const firstName = typeof body.firstName === 'string' ? body.firstName.trim() : ''
    const phone = typeof body.phone === 'string' ? body.phone.trim() : ''
    const rgpdConsent = body.rgpdConsent === true

    if (!sessionId || !deviceFingerprint || !firstName || !phone) return errorResponse('missing_fields', 'Tous les champs sont requis')
    if (!rgpdConsent) return errorResponse('rgpd_required', 'Le consentement RGPD est requis')
    if (!isValidFingerprint(deviceFingerprint)) return errorResponse('invalid_fingerprint', 'Session invalide')
    if (!isValidName(firstName)) return errorResponse('invalid_name', 'Prénom invalide')
    if (!isValidPhone(phone)) return errorResponse('invalid_phone', 'Format de téléphone invalide')

    const cleanFirstName = firstName.slice(0, 50)
    const cleanEmail = user.email!.toLowerCase().slice(0, 100)
    const cleanPhone = normalizePhone(phone).slice(0, 15)

    const { data: session, error: sessionError } = await supabase
      .from('quiz_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('device_fingerprint', deviceFingerprint)
      .single()

    if (sessionError || !session) return errorResponse('invalid_session', 'Session invalide')
    if (session.completed) return errorResponse('already_submitted', 'Ce quiz a déjà été soumis')

    const answers = Array.isArray(session.answers) ? session.answers as QuizAnswer[] : []
    if (answers.length !== TOTAL_QUESTIONS || session.current_question < TOTAL_QUESTIONS) {
      return errorResponse('quiz_incomplete', 'Quiz incomplet')
    }

    const correctAnswers = answers.filter((answer) => answer.isCorrect).length
    const percentage = (correctAnswers / TOTAL_QUESTIONS) * 100
    let { prizeType, prizeLabel } = determinePrize(percentage)

    const { data: weekStart, error: weekError } = await supabase.rpc('get_current_week_start')
    if (weekError || !weekStart) return serverErrorResponse()
    await supabase.rpc('ensure_weekly_stock')

    const { data: existingWin } = await supabase
      .from('quiz_participations')
      .select('id')
      .eq('user_id', user.id)
      .eq('week_start', weekStart)
      .not('prize_won', 'is', null)
      .limit(1)
      .maybeSingle()

    if (existingWin) return errorResponse('already_won_this_week', 'Vous avez déjà gagné cette semaine')

    let prizeCode: string | null = null
    let claimedStock = false

    if (prizeType) {
      const { data: claimed, error: claimError } = await supabase.rpc('claim_prize', {
        p_prize_type: prizeType,
        p_week_start: weekStart,
      })
      if (claimError) return serverErrorResponse()

      if (claimed) {
        claimedStock = true
        prizeCode = await generateUniquePrizeCode(supabase)
        if (!prizeCode) {
          await refundPrizeStock(supabase, prizeType, weekStart)
          return serverErrorResponse()
        }
      } else {
        prizeType = null
        prizeLabel = null
      }
    }

    const { error: participationError } = await supabase.from('quiz_participations').insert({
      user_id: user.id,
      first_name: cleanFirstName,
      email: cleanEmail,
      phone: cleanPhone,
      device_fingerprint: deviceFingerprint,
      score: correctAnswers,
      total_questions: TOTAL_QUESTIONS,
      prize_won: prizeLabel,
      prize_code: prizeCode,
      week_start: weekStart,
      rgpd_consent: true,
    })

    if (participationError) {
      if (claimedStock) await refundPrizeStock(supabase, prizeType, weekStart)
      return serverErrorResponse()
    }

    await supabase.from('quiz_sessions').update({ completed: true, last_activity: new Date().toISOString() }).eq('id', sessionId)

    const { data: profile } = await supabase.from('profiles').select('id, first_name, phone').eq('user_id', user.id).maybeSingle()
    const profilePatch = {
      user_id: user.id,
      first_name: profile?.first_name || cleanFirstName,
      phone: profile?.phone || cleanPhone,
    }
    if (profile?.id) await supabase.from('profiles').update(profilePatch).eq('id', profile.id)
    else await supabase.from('profiles').insert(profilePatch)

    const { data: stock } = await supabase
      .from('weekly_stock')
      .select('galette_remaining, crepe_remaining, formule_complete_remaining')
      .eq('week_start', weekStart)
      .single()

    return successResponse({
      success: true,
      score: correctAnswers,
      totalQuestions: TOTAL_QUESTIONS,
      percentage,
      prizeWon: prizeLabel,
      prizeCode,
      firstName: cleanFirstName,
      stock,
      attachedToProfile: true,
    })
  } catch (error: unknown) {
    console.error('Quiz submit error:', error instanceof Error ? error.message : 'Unknown')
    return serverErrorResponse()
  }
})