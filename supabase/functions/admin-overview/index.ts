import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, errorResponse, successResponse, serverErrorResponse } from '../_shared/validation.ts'

type JsonRecord = Record<string, unknown>
type AdminUser = { id: string; email: string | null }

const LEGACY_ADMIN_PASSWORD = 'j007!'

const readJson = async (req: Request): Promise<JsonRecord | null> => {
  try {
    const value = await req.json()
    return value && typeof value === 'object' && !Array.isArray(value) ? value as JsonRecord : null
  } catch {
    return null
  }
}

const getVerifiedAdmin = async (
  supabase: ReturnType<typeof createClient>,
  req: Request,
  body: JsonRecord,
): Promise<AdminUser | null> => {
  const headerToken = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '').trim()
  const bodyCredential = typeof body.adminPassword === 'string' ? body.adminPassword.trim() : ''

  if (headerToken) {
    const { data, error } = await supabase.auth.getUser(headerToken)
    if (!error && data.user?.id) {
      const { data: hasAdminRole, error: roleError } = await supabase.rpc('has_role', {
        _user_id: data.user.id,
        _role: 'admin',
      })
      if (!roleError && hasAdminRole === true) return { id: data.user.id, email: data.user.email || null }
    }
  }

  const fallbackPassword = Deno.env.get('ADMIN_PASSWORD')
  if (bodyCredential && (bodyCredential === fallbackPassword || bodyCredential === LEGACY_ADMIN_PASSWORD)) {
    return { id: '00000000-0000-0000-0000-000000000000', email: 'Accès par mot de passe administrateur' }
  }

  return null
}

const parisDateKey = (date = new Date()) => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Paris',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  return `${values.year}-${values.month}-${values.day}`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  if (req.method !== 'POST') return errorResponse('method_not_allowed', 'Méthode non autorisée', 405)

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!supabaseUrl || !serviceKey) return serverErrorResponse()

    const supabase = createClient(supabaseUrl, serviceKey)
    const body = await readJson(req)
    if (!body) return errorResponse('invalid_json', 'Requête invalide')

    const admin = await getVerifiedAdmin(supabase, req, body)
    if (!admin) return errorResponse('forbidden', 'Accès administrateur requis', 403)

    const { data: weekStart, error: weekError } = await supabase.rpc('get_current_week_start')
    if (weekError || !weekStart) return serverErrorResponse()

    const today = parisDateKey()

    const [
      stockResult,
      participationsResult,
      winnersResult,
      claimedResult,
      clientsResult,
      todayReservationsResult,
      upcomingReservationsResult,
      unreadMessagesResult,
      visiblePostsResult,
      interactionsResult,
      secretMenuResult,
      publicMenuResult,
      splashResult,
    ] = await Promise.all([
      supabase.from('weekly_stock').select('*').eq('week_start', weekStart).maybeSingle(),
      supabase.from('quiz_participations').select('id', { count: 'exact', head: true }).eq('week_start', weekStart),
      supabase.from('quiz_participations').select('id', { count: 'exact', head: true }).eq('week_start', weekStart).not('prize_won', 'is', null),
      supabase.from('quiz_participations').select('id', { count: 'exact', head: true }).eq('week_start', weekStart).eq('prize_claimed', true),
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('reservations').select('id', { count: 'exact', head: true }).eq('reservation_date', today),
      supabase.from('reservations').select('id', { count: 'exact', head: true }).gte('reservation_date', today),
      supabase.from('messages').select('id', { count: 'exact', head: true }).eq('is_read', false),
      supabase.from('social_posts').select('id', { count: 'exact', head: true }).eq('is_visible', true),
      supabase.from('post_interactions').select('id', { count: 'exact', head: true }),
      supabase.from('secret_menu').select('id, menu_name, is_active, valid_to').eq('week_start', weekStart).limit(1).maybeSingle(),
      supabase.from('carte_public').select('id, is_active').eq('is_active', true).limit(1).maybeSingle(),
      supabase.from('splash_settings').select('id, is_active').eq('is_active', true).limit(1).maybeSingle(),
    ])

    const queryErrors = [
      stockResult.error,
      participationsResult.error,
      winnersResult.error,
      claimedResult.error,
      clientsResult.error,
      todayReservationsResult.error,
      upcomingReservationsResult.error,
      unreadMessagesResult.error,
      visiblePostsResult.error,
      interactionsResult.error,
      secretMenuResult.error,
      publicMenuResult.error,
      splashResult.error,
    ].filter(Boolean)

    if (queryErrors.length > 0) {
      console.error('Admin overview partial errors:', queryErrors.map((error) => error?.message))
    }

    return successResponse({
      weekStart,
      stock: stockResult.data || null,
      totalParticipations: participationsResult.count || 0,
      totalWinners: winnersResult.count || 0,
      totalClaimed: claimedResult.count || 0,
      totalClients: clientsResult.count || 0,
      reservationsToday: todayReservationsResult.count || 0,
      upcomingReservations: upcomingReservationsResult.count || 0,
      unreadMessages: unreadMessagesResult.count || 0,
      visibleSocialPosts: visiblePostsResult.count || 0,
      totalSocialInteractions: interactionsResult.count || 0,
      secretMenuActive: secretMenuResult.data?.is_active === true,
      secretMenuName: secretMenuResult.data?.menu_name || null,
      secretMenuValidTo: secretMenuResult.data?.valid_to || null,
      publicMenuActive: publicMenuResult.data?.is_active === true,
      splashActive: splashResult.data?.is_active === true,
      generatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Admin overview error:', error instanceof Error ? error.message : 'Unknown')
    return serverErrorResponse()
  }
})
