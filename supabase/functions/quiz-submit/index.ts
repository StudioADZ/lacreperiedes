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
  sanitizeForLog
} from '../_shared/validation.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const body = await req.json()
    const { sessionId, deviceFingerprint, firstName, email, phone, rgpdConsent } = body

    // Log sanitized input for debugging (no PII)
    console.log('Quiz submit request:', sanitizeForLog(body))

    // Validate required fields
    if (!sessionId || !deviceFingerprint || !firstName || !email || !phone) {
      return errorResponse('missing_fields', 'Tous les champs sont requis')
    }

    if (!rgpdConsent) {
      return errorResponse('rgpd_required', 'Le consentement RGPD est requis')
    }

    // Validate input formats
    if (!isValidFingerprint(deviceFingerprint)) {
      return errorResponse('invalid_fingerprint', 'Session invalide')
    }

    if (!isValidName(firstName)) {
      return errorResponse('invalid_name', 'Prénom invalide (lettres uniquement, max 50 caractères)')
    }

    if (!isValidEmail(email)) {
      return errorResponse('invalid_email', 'Format d\'email invalide')
    }

    if (!isValidPhone(phone)) {
      return errorResponse('invalid_phone', 'Format de téléphone invalide (10 chiffres)')
    }

    // Sanitize inputs
    const cleanFirstName = firstName.trim().slice(0, 50)
    const cleanEmail = email.trim().toLowerCase().slice(0, 100)
    const cleanPhone = phone.replace(/[\s.-]/g, '').slice(0, 15)

    // Get session
    const { data: session, error: sessionError } = await supabase
      .from('quiz_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('device_fingerprint', deviceFingerprint)
      .single()

    if (sessionError || !session) {
      return errorResponse('invalid_session', 'Session invalide')
    }

    // Check if already completed
    if (session.completed) {
      return errorResponse('already_submitted', 'Ce quiz a déjà été soumis')
    }

    // Calculate score
    const correctAnswers = (session.answers || []).filter((a: { isCorrect: boolean }) => a.isCorrect).length
    const totalQuestions = 10
    const percentage = (correctAnswers / totalQuestions) * 100

    // Determine prize
    let prizeType: string | null = null
    let prizeLabel: string | null = null
    
    if (percentage === 100) {
      prizeType = 'formule_complete'
      prizeLabel = 'Formule Complète'
    } else if (percentage >= 90) {
      prizeType = 'galette'
      prizeLabel = 'Une Galette'
    } else if (percentage >= 80) {
      prizeType = 'crepe'
      prizeLabel = 'Une Crêpe'
    }

    // Get current week
    const { data: weekStart } = await supabase.rpc('get_current_week_start')

    // Check for existing win this week with same phone
    const { data: existingPhoneWin } = await supabase
      .from('quiz_participations')
      .select('id')
      .eq('phone', cleanPhone)
      .eq('week_start', weekStart)
      .not('prize_won', 'is', null)
      .maybeSingle()

    if (existingPhoneWin) {
      return errorResponse('phone_already_won', 'Ce numéro de téléphone a déjà gagné cette semaine')
    }

    // Check stock and claim prize if won
    let prizeCode: string | null = null

    if (prizeType) {
      // Ensure weekly stock exists
      await supabase.rpc('ensure_weekly_stock')

      // Try to claim prize
      const { data: claimed } = await supabase.rpc('claim_prize', {
        p_prize_type: prizeType,
        p_week_start: weekStart
      })

      if (claimed) {
        // Generate unique prize code
        const { data: code } = await supabase.rpc('generate_prize_code')
        prizeCode = code
      } else {
        // Stock exhausted
        prizeType = null
        prizeLabel = null
      }
    }

    // Create participation record
    const { error: partError } = await supabase
      .from('quiz_participations')
      .insert({
        first_name: cleanFirstName,
        email: cleanEmail,
        phone: cleanPhone,
        device_fingerprint: deviceFingerprint,
        score: correctAnswers,
        total_questions: totalQuestions,
        prize_won: prizeLabel,
        prize_code: prizeCode,
        week_start: weekStart,
        rgpd_consent: rgpdConsent
      })

    if (partError) {
      console.error('Participation insert error')
      return serverErrorResponse()
    }

    // Mark session as completed
    await supabase
      .from('quiz_sessions')
      .update({ completed: true })
      .eq('id', sessionId)

    // Get updated stock (public info)
    const { data: stock } = await supabase
      .from('weekly_stock')
      .select('galette_remaining, crepe_remaining, formule_complete_remaining')
      .eq('week_start', weekStart)
      .single()

    // Get secret code for winners/losers to access secret menu
    let secretCode: string | null = null
    if (prizeType || true) { // Always provide secret code as consolation prize
      const { data: menuData } = await supabase
        .from('secret_menu')
        .select('secret_code')
        .eq('is_active', true)
        .order('week_start', { ascending: false })
        .limit(1)
        .maybeSingle()
      
      secretCode = menuData?.secret_code || null
    }

    return successResponse({
      success: true,
      score: correctAnswers,
      totalQuestions,
      percentage,
      prizeWon: prizeLabel,
      prizeCode,
      firstName: cleanFirstName,
      stock,
      secretCode
    })

  } catch (error: unknown) {
    console.error('Quiz submit error:', error instanceof Error ? error.message : 'Unknown')
    return serverErrorResponse()
  }
})