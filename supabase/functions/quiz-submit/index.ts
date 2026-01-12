import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { sessionId, deviceFingerprint, firstName, email, phone, rgpdConsent } = await req.json()

    // Validate required fields
    if (!sessionId || !deviceFingerprint || !firstName || !email || !phone || !rgpdConsent) {
      return new Response(
        JSON.stringify({ error: 'missing_fields', message: 'Tous les champs sont requis' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Get session
    const { data: session, error: sessionError } = await supabase
      .from('quiz_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('device_fingerprint', deviceFingerprint)
      .single()

    if (sessionError || !session) {
      return new Response(
        JSON.stringify({ error: 'invalid_session', message: 'Session invalide' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Check if already completed
    if (session.completed) {
      return new Response(
        JSON.stringify({ error: 'already_submitted', message: 'Ce quiz a déjà été soumis' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Calculate score
    const correctAnswers = (session.answers || []).filter((a: any) => a.isCorrect).length
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
      .eq('phone', phone)
      .eq('week_start', weekStart)
      .not('prize_won', 'is', null)
      .maybeSingle()

    if (existingPhoneWin) {
      return new Response(
        JSON.stringify({ 
          error: 'phone_already_won', 
          message: 'Ce numéro de téléphone a déjà gagné cette semaine' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Check stock and claim prize if won
    let prizeCode: string | null = null
    let stockClaimed = false

    if (prizeType) {
      // Ensure weekly stock exists
      await supabase.rpc('ensure_weekly_stock')

      // Try to claim prize
      const { data: claimed } = await supabase.rpc('claim_prize', {
        p_prize_type: prizeType,
        p_week_start: weekStart
      })

      if (claimed) {
        stockClaimed = true
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
    const { data: participation, error: partError } = await supabase
      .from('quiz_participations')
      .insert({
        first_name: firstName,
        email,
        phone,
        device_fingerprint: deviceFingerprint,
        score: correctAnswers,
        total_questions: totalQuestions,
        prize_won: prizeLabel,
        prize_code: prizeCode,
        week_start: weekStart,
        rgpd_consent: rgpdConsent
      })
      .select()
      .single()

    if (partError) {
      console.error('Participation error:', partError)
      throw partError
    }

    // Mark session as completed
    await supabase
      .from('quiz_sessions')
      .update({ completed: true })
      .eq('id', sessionId)

    // Get updated stock
    const { data: stock } = await supabase
      .from('weekly_stock')
      .select('*')
      .eq('week_start', weekStart)
      .single()

    return new Response(
      JSON.stringify({
        success: true,
        score: correctAnswers,
        totalQuestions,
        percentage,
        prizeWon: prizeLabel,
        prizeCode,
        firstName,
        stock
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: unknown) {
    console.error('Quiz submit error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: 'server_error', message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})