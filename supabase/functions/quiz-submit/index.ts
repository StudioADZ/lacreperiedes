import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import {
  corsHeaders,
  isValidEmail,
  isValidPhone,
  isValidName,
  isValidFingerprint,
  errorResponse,
  successResponse,
  serverErrorResponse,
  sanitizeForLog,
} from '../_shared/validation.ts'

const TOTAL_QUESTIONS = 10
const MAX_CODE_ATTEMPTS = 8

type PrizeType = 'formule_complete' | 'galette' | 'crepe'

type QuizAnswer = {
  questionIndex: number
  answer: string
  isCorrect: boolean
}

type PrizeDecision = {
  prizeType: PrizeType | null
  prizeLabel: string | null
}

const normalizePhone = (phone: string): string => {
  const cleaned = phone.replace(/[\s.-]/g, '')
  if (cleaned.startsWith('+33')) return cleaned
  if (cleaned.startsWith('0')) return `+33${cleaned.slice(1)}`
  return cleaned
}

const determinePrize = (percentage: number): PrizeDecision => {
  if (percentage === 100) return { prizeType: 'formule_complete', prizeLabel: 'Formule Complète' }
  if (percentage >= 90) return { prizeType: 'galette', prizeLabel: 'Une Galette' }
  if (percentage >= 80) return { prizeType: 'crepe', prizeLabel: 'Une Crêpe' }
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
    return data && typeof data === 'object' && !Array.isArray(data)
      ? data as Record<string, unknown>
      : null
  } catch {
    return null
  }
}

async function getAuthenticatedUserId(
  supabase: ReturnType<typeof createClient>,
  req: Request,
): Promise<string | null> {
  const authHeader = req.headers.get('Authorization') || ''
  const token = authHeader.replace(/^Bearer\s+/i, '').trim()

  if (!token || token === 'null' || token === 'undefined') return null

  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data?.user?.id) {
    console.warn('Quiz submit authenticated profile lookup failed')
    return null
  }

  return data.user.id
}

async function attachWinToProfile(
  supabase: ReturnType<typeof createClient>,
  params: {
    userId: string | null
    firstName: string
    phone: string
    prizeLabel: string | null
    prizeCode: string | null
    secretCode: string | null
  },
) {
  if (!params.userId) return

  const { data: existingProfile, error: profileLookupError } = await supabase
    .from('profiles')
    .select('id, first_name, phone, secret_menu_unlocked, secret_menu_code')
    .eq('user_id', params.userId)
    .maybeSingle()

  if (profileLookupError) {
    console.warn('Quiz profile lookup failed')
    return
  }

  const profilePatch = {
    user_id: params.userId,
    first_name: existingProfile?.first_name || params.firstName,
    phone: existingProfile?.phone || params.phone,
    secret_menu_unlocked: params.prizeLabel ? true : existingProfile?.secret_menu_unlocked || false,
    secret_menu_code: params.secretCode || existingProfile?.secret_menu_code || null,
    secret_menu_unlocked_at: params.prizeLabel ? new Date().toISOString() : null,
  }

  if (existingProfile?.id) {
    const { error } = await supabase
      .from('profiles')
      .update(profilePatch)
      .eq('id', existingProfile.id)

    if (error) console.warn('Quiz profile update failed')
    return
  }

  const { error } = await supabase
    .from('profiles')
    .insert(profilePatch)

  if (error) console.warn('Quiz profile insert failed')
}

async function generateUniquePrizeCode(supabase: ReturnType<typeof createClient>): Promise<string | null> {
  for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt += 1) {
    const { data: code, error: codeError } = await supabase.rpc('generate_prize_code')

    if (codeError || !code || typeof code !== 'string') {
      console.error('Prize code generation error')
      return null
    }

    const { data: existingCode, error: lookupError } = await supabase
      .from('quiz_participations')
      .select('id')
      .eq('prize_code', code)
      .maybeSingle()

    if (lookupError) {
      console.error('Prize code uniqueness lookup error')
      return null
    }

    if (!existingCode) return code
  }

  return null
}

async function generateUniqueLossSecretCode(supabase: ReturnType<typeof createClient>): Promise<string | null> {
  for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt += 1) {
    const { data: code, error: codeError } = await supabase.rpc('generate_prize_code')

    if (codeError || !code || typeof code !== 'string') {
      console.error('Loss secret code generation error')
      return null
    }

    const { data: existingAccess, error: accessLookupError } = await supabase
      .from('secret_access')
      .select('id')
      .eq('secret_code', code)
      .maybeSingle()

    if (accessLookupError) {
      console.error('Loss secret access uniqueness lookup error')
      return null
    }

    const { data: existingPrize, error: prizeLookupError } = await supabase
      .from('quiz_participations')
      .select('id')
      .eq('prize_code', code)
      .maybeSingle()

    if (prizeLookupError) {
      console.error('Loss secret prize uniqueness lookup error')
      return null
    }

    if (!existingAccess && !existingPrize) return code
  }

  return null
}

async function refundPrizeStock(
  supabase: ReturnType<typeof createClient>,
  prizeType: PrizeType | null,
  weekStart: string | null,
) {
  if (!prizeType || !weekStart) return

  const column = getStockColumn(prizeType)
  const { data: stock } = await supabase
    .from('weekly_stock')
    .select(`${column}`)
    .eq('week_start', weekStart)
    .maybeSingle()

  const current = Number(stock?.[column] ?? 0)
  const { error } = await supabase
    .from('weekly_stock')
    .update({ [column]: current + 1 })
    .eq('week_start', weekStart)

  if (error) console.warn('Prize stock refund failed')
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  if (req.method !== 'POST') return errorResponse('method_not_allowed', 'Méthode non autorisée', 405)

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase environment variables')
      return serverErrorResponse()
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const authenticatedUserId = await getAuthenticatedUserId(supabase, req)
    const body = await readJson(req)

    if (!body) return errorResponse('invalid_json', 'Requête invalide')

    console.log('Quiz submit request:', sanitizeForLog(body))

    const sessionId = typeof body.sessionId === 'string' ? body.sessionId.trim() : ''
    const deviceFingerprint = typeof body.deviceFingerprint === 'string' ? body.deviceFingerprint.trim() : ''
    const firstName = typeof body.firstName === 'string' ? body.firstName.trim() : ''
    const email = typeof body.email === 'string' ? body.email.trim() : ''
    const phone = typeof body.phone === 'string' ? body.phone.trim() : ''
    const rgpdConsent = body.rgpdConsent === true

    if (!sessionId || !deviceFingerprint || !firstName || !email || !phone) {
      return errorResponse('missing_fields', 'Tous les champs sont requis')
    }

    if (!rgpdConsent) return errorResponse('rgpd_required', 'Le consentement RGPD est requis')
    if (!isValidFingerprint(deviceFingerprint)) return errorResponse('invalid_fingerprint', 'Session invalide')
    if (!isValidName(firstName)) return errorResponse('invalid_name', 'Prénom invalide')
    if (!isValidEmail(email)) return errorResponse('invalid_email', 'Format d\'email invalide')
    if (!isValidPhone(phone)) return errorResponse('invalid_phone', 'Format de téléphone invalide')

    const cleanFirstName = firstName.slice(0, 50)
    const cleanEmail = email.toLowerCase().slice(0, 100)
    const cleanPhone = normalizePhone(phone).slice(0, 15)

    const { data: session, error: sessionError } = await supabase
      .from('quiz_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('device_fingerprint', deviceFingerprint)
      .single()

    if (sessionError || !session) return errorResponse('invalid_session', 'Session invalide')
    if (session.completed) return errorResponse('already_submitted', 'Ce quiz a déjà été soumis')
    if (new Date(session.expires_at) < new Date()) return errorResponse('session_expired', 'Session expirée, veuillez recommencer')

    const answers = Array.isArray(session.answers) ? session.answers as QuizAnswer[] : []
    const questionIds = Array.isArray(session.question_ids) ? session.question_ids : []

    if (questionIds.length !== TOTAL_QUESTIONS || answers.length !== TOTAL_QUESTIONS || session.current_question < TOTAL_QUESTIONS) {
      return errorResponse('quiz_incomplete', 'Quiz incomplet')
    }

    const uniqueQuestionIndexes = new Set<number>()
    for (const item of answers) {
      if (
        typeof item.questionIndex !== 'number'
        || item.questionIndex < 0
        || item.questionIndex >= TOTAL_QUESTIONS
        || uniqueQuestionIndexes.has(item.questionIndex)
      ) {
        return errorResponse('invalid_answers', 'Réponses invalides')
      }
      uniqueQuestionIndexes.add(item.questionIndex)
    }

    const correctAnswers = answers.filter((a) => a.isCorrect).length
    const percentage = (correctAnswers / TOTAL_QUESTIONS) * 100
    let { prizeType, prizeLabel } = determinePrize(percentage)

    const { data: weekStart, error: weekError } = await supabase.rpc('get_current_week_start')
    if (weekError || !weekStart) {
      console.error('Current week lookup error')
      return serverErrorResponse()
    }

    await supabase.rpc('ensure_weekly_stock')

    const existingWinQuery = supabase
      .from('quiz_participations')
      .select('id')
      .eq('week_start', weekStart)
      .not('prize_won', 'is', null)
      .or(`phone.eq.${cleanPhone},email.eq.${cleanEmail},device_fingerprint.eq.${deviceFingerprint}`)
      .limit(1)
      .maybeSingle()

    const { data: existingWin, error: existingWinError } = await existingWinQuery

    if (existingWinError) {
      console.error('Existing win lookup error')
      return serverErrorResponse()
    }

    if (existingWin) return errorResponse('already_won_this_week', 'Vous avez déjà gagné cette semaine')

    let prizeCode: string | null = null
    let claimedStock = false

    if (prizeType) {
      const { data: claimed, error: claimError } = await supabase.rpc('claim_prize', {
        p_prize_type: prizeType,
        p_week_start: weekStart,
      })

      if (claimError) {
        console.error('Prize claim error')
        return serverErrorResponse()
      }

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

    const { error: partError } = await supabase
      .from('quiz_participations')
      .insert({
        first_name: cleanFirstName,
        email: cleanEmail,
        phone: cleanPhone,
        device_fingerprint: deviceFingerprint,
        score: correctAnswers,
        total_questions: TOTAL_QUESTIONS,
        prize_won: prizeLabel,
        prize_code: prizeCode,
        week_start: weekStart,
        rgpd_consent: rgpdConsent,
      })

    if (partError) {
      console.error('Participation insert error')
      if (claimedStock) await refundPrizeStock(supabase, prizeType, weekStart)
      return serverErrorResponse()
    }

    const { error: completeError } = await supabase
      .from('quiz_sessions')
      .update({ completed: true, last_activity: new Date().toISOString() })
      .eq('id', sessionId)
      .eq('device_fingerprint', deviceFingerprint)

    if (completeError) console.warn('Session completion update failed')

    const { data: stock } = await supabase
      .from('weekly_stock')
      .select('galette_remaining, crepe_remaining, formule_complete_remaining')
      .eq('week_start', weekStart)
      .single()

    const { data: menuData } = await supabase
      .from('secret_menu')
      .select('secret_code')
      .eq('is_active', true)
      .order('week_start', { ascending: false })
      .limit(1)
      .maybeSingle()

    let secretMenuCode = menuData?.secret_code || null

    if (!prizeLabel) {
      const lossCode = await generateUniqueLossSecretCode(supabase)

      if (lossCode) {
        const { error: grantLossAccessError } = await supabase.rpc('grant_secret_access', {
          p_email: cleanEmail,
          p_phone: cleanPhone,
          p_first_name: cleanFirstName,
          p_secret_code: lossCode,
          p_week_start: weekStart,
        })

        if (grantLossAccessError) {
          console.warn('Loss secret access grant failed')
        } else {
          secretMenuCode = lossCode
        }
      }
    }

    await attachWinToProfile(supabase, {
      userId: authenticatedUserId,
      firstName: cleanFirstName,
      phone: cleanPhone,
      prizeLabel,
      prizeCode,
      secretCode: secretMenuCode,
    })

    return successResponse({
      success: true,
      score: correctAnswers,
      totalQuestions: TOTAL_QUESTIONS,
      percentage,
      prizeWon: prizeLabel,
      prizeCode,
      firstName: cleanFirstName,
      stock,
      secretCode: secretMenuCode,
      attachedToProfile: !!authenticatedUserId,
    })
  } catch (error: unknown) {
    console.error('Quiz submit error:', error instanceof Error ? error.message : 'Unknown')
    return serverErrorResponse()
  }
})
