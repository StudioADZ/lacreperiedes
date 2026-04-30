import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import {
  corsHeaders,
  isValidFingerprint,
  errorResponse,
  successResponse,
  serverErrorResponse,
} from '../_shared/validation.ts'

const QUIZ_SIZE = 10
const SESSION_TTL_MS = 5 * 60 * 1000
const PREMIUM_CATEGORIES = ['local', 'food', 'bretagne'] as const

type QuizCategory = typeof PREMIUM_CATEGORIES[number]
type QuestionLite = {
  id: string
  question?: string | null
  category?: string | null
}

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

const isPremiumCategory = (category: string | null | undefined): category is QuizCategory =>
  PREMIUM_CATEGORIES.includes(category as QuizCategory)

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

const selectPremiumQuestions = (questions: QuestionLite[]): QuestionLite[] => {
  const uniqueQuestions = uniqueByQuestionText(questions.filter((q) => isPremiumCategory(q.category)))
  const byCategory = new Map<QuizCategory, QuestionLite[]>()

  for (const category of PREMIUM_CATEGORIES) {
    byCategory.set(
      category,
      shuffle(uniqueQuestions.filter((q) => q.category === category)),
    )
  }

  // Mix premium équilibré : 4 local, 3 food, 3 bretagne.
  // Si une catégorie n'a pas assez de questions, on complète avec les autres.
  const preferred: Record<QuizCategory, number> = {
    local: 4,
    food: 3,
    bretagne: 3,
  }

  const selected: QuestionLite[] = []
  const selectedIds = new Set<string>()

  for (const category of PREMIUM_CATEGORIES) {
    const pool = byCategory.get(category) || []
    for (const question of pool.slice(0, preferred[category])) {
      if (selectedIds.has(question.id)) continue
      selectedIds.add(question.id)
      selected.push(question)
    }
  }

  const fallbackPool = shuffle(uniqueQuestions)
  for (const question of fallbackPool) {
    if (selected.length >= QUIZ_SIZE) break
    if (selectedIds.has(question.id)) continue
    selectedIds.add(question.id)
    selected.push(question)
  }

  return shuffle(selected).slice(0, QUIZ_SIZE)
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return errorResponse('method_not_allowed', 'Méthode non autorisée', 405)
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase environment variables')
      return serverErrorResponse()
    }

    const body = await readJson(req)
    if (!body) {
      return errorResponse('invalid_json', 'Requête invalide')
    }

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

      // Banque premium complète : local + food + bretagne, sans doublon de texte.
      const { data: questionBank, error: bankError } = await supabase
        .from('quiz_questions')
        .select('id, question, category')
        .eq('is_active', true)
        .in('category', PREMIUM_CATEGORIES)
        .limit(1000)

      if (bankError) {
        console.error('Question bank lookup error')
        return serverErrorResponse()
      }

      const selected = selectPremiumQuestions(questionBank || [])

      if (selected.length < QUIZ_SIZE) {
        return errorResponse('not_enough_questions', 'Pas assez de questions disponibles')
      }

      const selectedIds = selected.map((q) => q.id)

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
        .select('id, question, option_a, option_b, option_c, option_d, category')
        .eq('is_active', true)
        .in('id', selectedIds)

      const orderedQuestions = selectedIds
        .map((id) => questions?.find((q) => q.id === id))
        .filter(Boolean)

      return successResponse({ session, questions: orderedQuestions })
    }

    if (action === 'answer') {
      if (!sessionId) {
        return errorResponse('invalid_session', 'Session invalide')
      }

      if (!answer || !['A', 'B', 'C', 'D'].includes(answer)) {
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

      if (sessionError || !session) {
        return errorResponse('invalid_session', 'Session invalide')
      }

      if (session.completed) {
        return errorResponse('already_completed', 'Quiz déjà terminé')
      }

      if (new Date(session.expires_at) < new Date()) {
        return errorResponse('session_expired', 'Session expirée, veuillez recommencer')
      }

      if (!Array.isArray(session.question_ids) || session.question_ids.length !== QUIZ_SIZE) {
        return errorResponse('invalid_session', 'Session invalide')
      }

      const existingAnswers = Array.isArray(session.answers) ? session.answers : []
      if (existingAnswers.some((item: { questionIndex?: number }) => item?.questionIndex === questionIndex)) {
        return errorResponse('duplicate_answer', 'Cette question a déjà été validée')
      }

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

      if (questionError || !question) {
        return errorResponse('invalid_question', 'Question invalide')
      }

      const isCorrect = question.correct_answer === answer
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

      if (updateError) {
        console.error('Session update error')
        return serverErrorResponse()
      }

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
