import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { 
  corsHeaders, 
  isValidFingerprint,
  errorResponse,
  successResponse,
  serverErrorResponse
} from '../_shared/validation.ts'

const QUIZ_SIZE = 10

const shuffle = <T>(items: T[]): T[] => {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

const uniqueByQuestionText = <T extends { id: string; question?: string | null }>(items: T[]): T[] => {
  const seen = new Set<string>()
  const unique: T[] = []

  for (const item of items) {
    const key = (item.question || item.id)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim()

    if (seen.has(key)) continue
    seen.add(key)
    unique.push(item)
  }

  return unique
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

    if (!isValidFingerprint(deviceFingerprint)) {
      return errorResponse('invalid_fingerprint', 'Session invalide')
    }

    if (action === 'start') {
      const { data: existingSession } = await supabase
        .from('quiz_sessions')
        .select('*')
        .eq('device_fingerprint', deviceFingerprint)
        .eq('completed', false)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle()

      if (existingSession) {
        const { data: questions } = await supabase
          .from('quiz_questions')
          .select('id, question, option_a, option_b, option_c, option_d')
          .in('id', existingSession.question_ids)

        const orderedQuestions = existingSession.question_ids
          .map((id: string) => questions?.find((q) => q.id === id))
          .filter(Boolean)

        return successResponse({ session: existingSession, questions: orderedQuestions })
      }

      // Premium mix: more variety, no duplicated question wording inside a session.
      const { data: localQuestions } = await supabase
        .from('quiz_questions')
        .select('id, question')
        .eq('is_active', true)
        .eq('category', 'local')
        .limit(150)

      const { data: foodQuestions } = await supabase
        .from('quiz_questions')
        .select('id, question')
        .eq('is_active', true)
        .eq('category', 'food')
        .limit(100)

      const uniqueLocal = shuffle(uniqueByQuestionText(localQuestions || []))
      const uniqueFood = shuffle(uniqueByQuestionText(foodQuestions || []))

      const selected = uniqueByQuestionText([
        ...uniqueLocal.slice(0, 7),
        ...uniqueFood.slice(0, 3),
        ...uniqueLocal.slice(7),
        ...uniqueFood.slice(3),
      ]).slice(0, QUIZ_SIZE)

      if (selected.length < QUIZ_SIZE) {
        return errorResponse('not_enough_questions', 'Pas assez de questions disponibles')
      }

      const selectedIds = shuffle(selected).map((q) => q.id)

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

      const { data: questions } = await supabase
        .from('quiz_questions')
        .select('id, question, option_a, option_b, option_c, option_d')
        .in('id', selectedIds)

      const orderedQuestions = selectedIds
        .map((id) => questions?.find((q) => q.id === id))
        .filter(Boolean)

      return successResponse({ session, questions: orderedQuestions })
    }

    if (action === 'answer') {
      if (!sessionId || typeof sessionId !== 'string') {
        return errorResponse('invalid_session', 'Session invalide')
      }

      if (!answer || !['A', 'B', 'C', 'D'].includes(answer)) {
        return errorResponse('invalid_answer', 'Réponse invalide')
      }

      if (typeof questionIndex !== 'number' || questionIndex < 0 || questionIndex > 9) {
        return errorResponse('invalid_question', 'Question invalide')
      }

      const { data: session, error: sessionError } = await supabase
        .from('quiz_sessions')
        .select('*')
        .eq('id', sessionId)
        .eq('device_fingerprint', deviceFingerprint)
        .single()

      if (sessionError || !session) {
        return errorResponse('invalid_session', 'Session invalide')
      }

      if (new Date(session.expires_at) < new Date()) {
        return errorResponse('session_expired', 'Session expirée, veuillez recommencer')
      }

      const questionId = session.question_ids[questionIndex]
      const { data: question } = await supabase
        .from('quiz_questions')
        .select('correct_answer')
        .eq('id', questionId)
        .single()

      const isCorrect = question?.correct_answer === answer
      const newAnswers = [...(session.answers || []), { questionIndex, answer, isCorrect }]
      
      const { error: updateError } = await supabase
        .from('quiz_sessions')
        .update({
          answers: newAnswers,
          current_question: questionIndex + 1,
          last_activity: new Date().toISOString(),
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
