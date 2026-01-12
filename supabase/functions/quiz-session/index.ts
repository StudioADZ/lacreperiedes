import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { 
  corsHeaders, 
  isValidFingerprint,
  errorResponse,
  successResponse,
  serverErrorResponse
} from '../_shared/validation.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { action, deviceFingerprint, sessionId, answer, questionIndex } = await req.json()

    // Validate device fingerprint for all actions
    if (!isValidFingerprint(deviceFingerprint)) {
      return errorResponse('invalid_fingerprint', 'Session invalide')
    }

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
        return errorResponse('already_won', 'Vous avez déjà gagné cette semaine !')
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

        return successResponse({ session: existingSession, questions })
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
        return errorResponse('not_enough_questions', 'Pas assez de questions disponibles')
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
        console.error('Session creation error')
        return serverErrorResponse()
      }

      // Get full questions (without correct_answer for security)
      const { data: questions } = await supabase
        .from('quiz_questions')
        .select('id, question, option_a, option_b, option_c, option_d')
        .in('id', selectedIds)

      // Order questions according to session order
      const orderedQuestions = selectedIds.map(id => 
        questions?.find(q => q.id === id)
      ).filter(Boolean)

      return successResponse({ session, questions: orderedQuestions })
    }

    if (action === 'answer') {
      // Validate session ID format
      if (!sessionId || typeof sessionId !== 'string') {
        return errorResponse('invalid_session', 'Session invalide')
      }

      // Validate answer
      if (!answer || !['A', 'B', 'C', 'D'].includes(answer)) {
        return errorResponse('invalid_answer', 'Réponse invalide')
      }

      // Validate question index
      if (typeof questionIndex !== 'number' || questionIndex < 0 || questionIndex > 9) {
        return errorResponse('invalid_question', 'Question invalide')
      }

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

      // Check if session expired
      if (new Date(session.expires_at) < new Date()) {
        return errorResponse('session_expired', 'Session expirée, veuillez recommencer')
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

      if (updateError) {
        console.error('Session update error')
        return serverErrorResponse()
      }

      return successResponse({ isCorrect, correctAnswer: question?.correct_answer })
    }

    if (action === 'reset') {
      // Invalidate current session (for tab switch / inactivity)
      await supabase
        .from('quiz_sessions')
        .update({ completed: true })
        .eq('device_fingerprint', deviceFingerprint)
        .eq('completed', false)

      return successResponse({ success: true })
    }

    return errorResponse('invalid_action', 'Action non reconnue')

  } catch (error: unknown) {
    console.error('Quiz session error:', error instanceof Error ? error.message : 'Unknown')
    return serverErrorResponse()
  }
})