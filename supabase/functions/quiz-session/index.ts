import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import {
  corsHeaders,
  isValidFingerprint,
  errorResponse,
  successResponse,
  serverErrorResponse,
} from '../_shared/validation.ts'

const QUIZ_SIZE = 10
const SESSION_TTL_MS = 8 * 60 * 1000

type QuestionLite = {
  id: string
  question?: string | null
}

const shuffle = <T>(items: T[]): T[] => {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

const normalizeQuestion = (value: string) => value
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, ' ')
  .trim()

const selectRandomQuestions = (questions: QuestionLite[]): QuestionLite[] => {
  const seen = new Set<string>()
  const unique = questions.filter((item) => {
    const key = normalizeQuestion(item.question || item.id)
    if (!key || seen.has(key)) return false
    seen.add(key)
    return true
  })

  return shuffle(unique).slice(0, QUIZ_SIZE)
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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  if (req.method !== 'POST') return errorResponse('method_not_allowed', 'Méthode non autorisée', 405)

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!supabaseUrl || !supabaseServiceKey) return serverErrorResponse()

    const body = await readJson(req)
    if (!body) return errorResponse('invalid_json', 'Requête invalide')

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const action = typeof body.action === 'string' ? body.action : ''
    const deviceFingerprint = typeof body.deviceFingerprint === 'string' ? body.deviceFingerprint.trim() : ''
    const sessionId = typeof body.sessionId === 'string' ? body.sessionId.trim() : ''
    const answer = typeof body.answer === 'string' ? body.answer.trim() : ''
    const questionIndex = typeof body.questionIndex === 'number' ? body.questionIndex : null

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
          .select('id, question, option_a, option_b, option_c, option_d, category')
          .eq('is_active', true)
          .in('id', existingSession.question_ids)

        const orderedQuestions = existingSession.question_ids
          .map((id: string) => questions?.find((q) => q.id === id))
          .filter(Boolean)

        return successResponse({ session: existingSession, questions: orderedQuestions })
      }

      const { data: questionBank, error: bankError } = await supabase
        .from('quiz_questions')
        .select('id, question')
        .eq('is_active', true)
        .limit(2000)

      if (bankError) return serverErrorResponse()

      const selected = selectRandomQuestions(questionBank || [])
      if (selected.length < QUIZ_SIZE) {
        return errorResponse('not_enough_questions', 'Pas assez de questions disponibles')
      }

      const selectedIds = selected.map((q) => q.id)
      const { data: session, error: sessionError } = await supabase
        .from('quiz_sessions')
        .insert({ device_fingerprint: deviceFingerprint, question_ids: selectedIds })
        .select()
        .single()

      if (sessionError) return serverErrorResponse()

      const { data: questions } = await supabase
        .from('quiz_questions')
        .select('id, question, option_a, option_b, option_c, option_d, category')
        .eq('is_active', true)
        .in('id', selectedIds)

      const orderedQuestions = selectedIds
        .map((id) => questions?.find((q) => q.id === id))
        .filter(Boolean)

      return successResponse({ session, questions: orderedQuestions })
    }

    if (action === 'answer') {
      if (!sessionId) return errorResponse('invalid_session', 'Session invalide')
      if (!answer || !['A', 'B', 'C', 'D', 'TIMEOUT'].includes(answer)) {
        return errorResponse('invalid_answer', 'Réponse invalide')
      }
      if (typeof questionIndex !== 'number' || questionIndex < 0 || questionIndex >= QUIZ_SIZE) {
        return errorResponse('invalid_question', 'Question invalide')
      }

      const { data: session, error: sessionError } = await supabase
        .from('quiz_sessions')
        .select('*')
        .eq('id', sessionId)
        .eq('device_fingerprint', deviceFingerprint)
        .single()

      if (sessionError || !session) return errorResponse('invalid_session', 'Session invalide')
      if (session.completed) return errorResponse('already_completed', 'Quiz déjà terminé')
      if (new Date(session.expires_at) < new Date()) {
        return errorResponse('session_expired', 'Session expirée, veuillez recommencer')
      }

      const existingAnswers = Array.isArray(session.answers) ? session.answers : []
      if (questionIndex !== existingAnswers.length) {
        return errorResponse('invalid_question_order', 'Ordre de question invalide')
      }

      const questionId = session.question_ids[questionIndex]
      const { data: question, error: questionError } = await supabase
        .from('quiz_questions')
        .select('correct_answer')
        .eq('id', questionId)
        .eq('is_active', true)
        .single()

      if (questionError || !question) return errorResponse('invalid_question', 'Question invalide')

      const isCorrect = answer !== 'TIMEOUT' && question.correct_answer === answer
      const newAnswers = [...existingAnswers, { questionIndex, answer, isCorrect }]

      const { error: updateError } = await supabase
        .from('quiz_sessions')
        .update({
          answers: newAnswers,
          current_question: questionIndex + 1,
          last_activity: new Date().toISOString(),
          expires_at: new Date(Date.now() + SESSION_TTL_MS).toISOString(),
        })
        .eq('id', sessionId)
        .eq('device_fingerprint', deviceFingerprint)
        .eq('completed', false)

      if (updateError) return serverErrorResponse()
      return successResponse({ isCorrect, correctAnswer: question.correct_answer })
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