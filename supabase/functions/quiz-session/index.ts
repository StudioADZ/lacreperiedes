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

    const { action, deviceFingerprint, sessionId, answer, questionIndex } = await req.json()

    if (action === 'start') {
      // Check if device already has a winning participation this week
      const { data: weekStart } = await supabase.rpc('get_current_week_start')
      
      const { data: existingWin } = await supabase
        .from('quiz_participations')
        .select('id')
        .eq('device_fingerprint', deviceFingerprint)
        .eq('week_start', weekStart)
        .not('prize_won', 'is', null)
        .maybeSingle()

      if (existingWin) {
        return new Response(
          JSON.stringify({ error: 'already_won', message: 'Vous avez déjà gagné cette semaine !' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }

      // Check for existing active session
      const { data: existingSession } = await supabase
        .from('quiz_sessions')
        .select('*')
        .eq('device_fingerprint', deviceFingerprint)
        .eq('completed', false)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle()

      if (existingSession) {
        // Get questions for existing session
        const { data: questions } = await supabase
          .from('quiz_questions')
          .select('id, question, option_a, option_b, option_c, option_d')
          .in('id', existingSession.question_ids)

        return new Response(
          JSON.stringify({ session: existingSession, questions }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Get 10 random active questions (80% local, 20% food)
      const { data: localQuestions } = await supabase
        .from('quiz_questions')
        .select('id')
        .eq('is_active', true)
        .eq('category', 'local')
        .limit(100)

      const { data: foodQuestions } = await supabase
        .from('quiz_questions')
        .select('id')
        .eq('is_active', true)
        .eq('category', 'food')
        .limit(50)

      // Shuffle and pick
      const shuffledLocal = (localQuestions || []).sort(() => Math.random() - 0.5).slice(0, 8)
      const shuffledFood = (foodQuestions || []).sort(() => Math.random() - 0.5).slice(0, 2)
      const selectedIds = [...shuffledLocal, ...shuffledFood]
        .sort(() => Math.random() - 0.5)
        .map(q => q.id)

      if (selectedIds.length < 10) {
        return new Response(
          JSON.stringify({ error: 'not_enough_questions', message: 'Pas assez de questions disponibles' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }

      // Create session
      const { data: session, error: sessionError } = await supabase
        .from('quiz_sessions')
        .insert({
          device_fingerprint: deviceFingerprint,
          question_ids: selectedIds,
        })
        .select()
        .single()

      if (sessionError) {
        console.error('Session creation error:', sessionError)
        throw sessionError
      }

      // Get full questions
      const { data: questions } = await supabase
        .from('quiz_questions')
        .select('id, question, option_a, option_b, option_c, option_d')
        .in('id', selectedIds)

      // Order questions according to session order
      const orderedQuestions = selectedIds.map(id => 
        questions?.find(q => q.id === id)
      ).filter(Boolean)

      return new Response(
        JSON.stringify({ session, questions: orderedQuestions }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'answer') {
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

      // Check if session expired
      if (new Date(session.expires_at) < new Date()) {
        return new Response(
          JSON.stringify({ error: 'session_expired', message: 'Session expirée, veuillez recommencer' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }

      // Get the question to verify answer
      const questionId = session.question_ids[questionIndex]
      const { data: question } = await supabase
        .from('quiz_questions')
        .select('correct_answer')
        .eq('id', questionId)
        .single()

      const isCorrect = question?.correct_answer === answer

      // Update session
      const newAnswers = [...(session.answers || []), { questionIndex, answer, isCorrect }]
      
      const { error: updateError } = await supabase
        .from('quiz_sessions')
        .update({
          answers: newAnswers,
          current_question: questionIndex + 1,
          last_activity: new Date().toISOString(),
          // Extend expiry by 5 min on each answer
          expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString()
        })
        .eq('id', sessionId)

      if (updateError) throw updateError

      return new Response(
        JSON.stringify({ isCorrect, correctAnswer: question?.correct_answer }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'reset') {
      // Invalidate current session (for tab switch / inactivity)
      await supabase
        .from('quiz_sessions')
        .update({ completed: true })
        .eq('device_fingerprint', deviceFingerprint)
        .eq('completed', false)

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'invalid_action' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )

  } catch (error: unknown) {
    console.error('Quiz session error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: 'server_error', message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})