import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import {
  corsHeaders,
  isValidPrizeCode,
  errorResponse,
  successResponse,
  serverErrorResponse,
  sanitizeForLog,
} from '../_shared/validation.ts'

type AdminUser = { id: string; email: string | null }
type JsonRecord = Record<string, unknown>

const PARIS_TIME_ZONE = 'Europe/Paris'

const readJson = async (req: Request): Promise<JsonRecord | null> => {
  try {
    const value = await req.json()
    return value && typeof value === 'object' && !Array.isArray(value) ? value as JsonRecord : null
  } catch {
    return null
  }
}

const getBearerToken = (req: Request, body: JsonRecord) => {
  const headerToken = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '').trim()
  if (headerToken) return headerToken

  // Transitional compatibility: older admin panels send their session token in this field.
  const bodyToken = typeof body.adminPassword === 'string' ? body.adminPassword.trim() : ''
  return bodyToken
}

const getVerifiedAdmin = async (
  supabase: ReturnType<typeof createClient>,
  req: Request,
  body: JsonRecord,
): Promise<AdminUser | null> => {
  const token = getBearerToken(req, body)
  if (!token) return null

  const { data: authData, error: authError } = await supabase.auth.getUser(token)
  const user = authData.user
  if (authError || !user?.id) return null

  const { data: hasAdminRole, error: roleError } = await supabase.rpc('has_role', {
    _user_id: user.id,
    _role: 'admin',
  })

  if (roleError || hasAdminRole !== true) return null
  return { id: user.id, email: user.email || null }
}

const writeAuditLog = async (
  supabase: ReturnType<typeof createClient>,
  admin: AdminUser,
  action: string,
  targetType?: string,
  targetId?: string | null,
  metadata: JsonRecord = {},
) => {
  const { error } = await supabase.from('admin_audit_logs').insert({
    admin_user_id: admin.id,
    admin_email: admin.email,
    action,
    target_type: targetType || null,
    target_id: targetId || null,
    metadata,
  })

  if (error) console.error('Admin audit log failed:', error.message)
}

const parisDateParts = (date: Date) => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: PARIS_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
    weekday: 'short',
  }).formatToParts(date)

  return Object.fromEntries(parts.map((part) => [part.type, part.value]))
}

const isPrizeExpired = (weekStart: string, now = new Date()) => {
  const monday = new Date(`${weekStart}T00:00:00Z`)
  if (Number.isNaN(monday.getTime())) return true

  const sunday = new Date(monday)
  sunday.setUTCDate(sunday.getUTCDate() + 6)
  const sundayKey = sunday.toISOString().slice(0, 10)
  const current = parisDateParts(now)
  const currentKey = `${current.year}-${current.month}-${current.day}`

  if (currentKey > sundayKey) return true
  if (currentKey < sundayKey) return false
  return Number(current.hour) >= 22
}

const weekNumber = (weekStart: string) => {
  const date = new Date(`${weekStart}T00:00:00Z`)
  if (Number.isNaN(date.getTime())) return 0
  const start = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
  return Math.ceil(((date.getTime() - start.getTime()) / 86400000 + start.getUTCDay() + 1) / 7)
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

    const action = typeof body.action === 'string' ? body.action : ''
    const code = typeof body.code === 'string' ? body.code.trim().toUpperCase() : ''
    const participationId = typeof body.participationId === 'string' ? body.participationId.trim() : ''
    const menuId = typeof body.menuId === 'string' ? body.menuId.trim() : ''
    const menuData = body.menuData && typeof body.menuData === 'object' && !Array.isArray(body.menuData)
      ? body.menuData as JsonRecord
      : null

    console.log('Admin request:', sanitizeForLog({ action, menuId, participationId, adminUserId: admin.id }))

    if (action === 'verify') {
      if (!code) return errorResponse('missing_code', 'Code requis')
      if (!isValidPrizeCode(code)) return errorResponse('invalid_code', 'Format de code invalide')

      const { data: participation, error } = await supabase
        .from('quiz_participations')
        .select('id, first_name, prize_won, week_start, prize_claimed, claimed_at, created_at, status')
        .eq('prize_code', code)
        .maybeSingle()

      if (error) return serverErrorResponse()
      if (!participation) return successResponse({ valid: false, status: 'not_found', message: 'Code non trouvé' })
      if (participation.status === 'invalidated') {
        return successResponse({ valid: false, status: 'invalidated', message: 'Ce coupon a été invalidé' })
      }
      if (isPrizeExpired(participation.week_start)) {
        return successResponse({ valid: false, status: 'expired', message: 'Ce gain a expiré dimanche à 22h00' })
      }
      if (participation.prize_claimed) {
        return successResponse({
          valid: true,
          status: 'already_claimed',
          id: participation.id,
          firstName: participation.first_name,
          prize: participation.prize_won,
          weekNumber: weekNumber(participation.week_start),
          claimed: true,
          claimedAt: participation.claimed_at,
        })
      }

      await writeAuditLog(supabase, admin, 'prize.verify', 'quiz_participation', participation.id)
      return successResponse({
        valid: true,
        status: 'valid',
        id: participation.id,
        firstName: participation.first_name,
        prize: participation.prize_won,
        weekNumber: weekNumber(participation.week_start),
        weekStart: participation.week_start,
        claimed: false,
        createdAt: participation.created_at,
      })
    }

    if (action === 'claim') {
      if (!code) return errorResponse('missing_code', 'Code requis')
      if (!isValidPrizeCode(code)) return errorResponse('invalid_code', 'Format de code invalide')

      const { data: existing, error: lookupError } = await supabase
        .from('quiz_participations')
        .select('id, first_name, prize_won, week_start, status, prize_claimed')
        .eq('prize_code', code)
        .maybeSingle()

      if (lookupError) return serverErrorResponse()
      if (!existing) return successResponse({ success: false, message: 'Code non trouvé' })
      if (existing.status === 'invalidated') return successResponse({ success: false, message: 'Ce coupon a été invalidé' })
      if (isPrizeExpired(existing.week_start)) return successResponse({ success: false, message: 'Ce gain a expiré dimanche à 22h00' })
      if (existing.prize_claimed) return successResponse({ success: false, message: 'Ce lot a déjà été utilisé' })

      const claimedAt = new Date().toISOString()
      const { data, error } = await supabase
        .from('quiz_participations')
        .update({ prize_claimed: true, claimed_at: claimedAt, status: 'claimed' })
        .eq('id', existing.id)
        .eq('prize_claimed', false)
        .neq('status', 'invalidated')
        .select('id, first_name, prize_won')
        .maybeSingle()

      if (error) return serverErrorResponse()
      if (!data) return successResponse({ success: false, message: 'Le gain a déjà été traité sur un autre appareil' })

      await writeAuditLog(supabase, admin, 'prize.claim', 'quiz_participation', data.id, { code_suffix: code.slice(-3) })
      return successResponse({ success: true, message: 'Lot marqué comme utilisé', firstName: data.first_name, prize: data.prize_won })
    }

    if (action === 'invalidate') {
      if (!participationId) return errorResponse('missing_id', 'ID participation requis')

      const { data, error } = await supabase
        .from('quiz_participations')
        .update({ status: 'invalidated', prize_claimed: true, claimed_at: new Date().toISOString() })
        .eq('id', participationId)
        .select('id, first_name')
        .single()

      if (error) return serverErrorResponse()
      await writeAuditLog(supabase, admin, 'prize.invalidate', 'quiz_participation', data.id)
      return successResponse({ success: true, message: 'Participation invalidée', firstName: data.first_name })
    }

    if (action === 'list_participations') {
      const { data: participations, error } = await supabase
        .from('quiz_participations')
        .select('id, created_at, first_name, email, phone, score, total_questions, prize_won, prize_code, prize_claimed, claimed_at, status, week_start')
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) return serverErrorResponse()
      return successResponse({ participations })
    }

    if (action === 'stats') {
      const { data: weekStart, error: weekError } = await supabase.rpc('get_current_week_start')
      if (weekError || !weekStart) return serverErrorResponse()

      const [{ data: stock }, { count: totalParticipations }, { count: totalWinners }, { count: totalClaimed }] = await Promise.all([
        supabase.from('weekly_stock').select('*').eq('week_start', weekStart).maybeSingle(),
        supabase.from('quiz_participations').select('id', { count: 'exact', head: true }).eq('week_start', weekStart),
        supabase.from('quiz_participations').select('id', { count: 'exact', head: true }).eq('week_start', weekStart).not('prize_won', 'is', null),
        supabase.from('quiz_participations').select('id', { count: 'exact', head: true }).eq('week_start', weekStart).eq('prize_claimed', true),
      ])

      return successResponse({
        weekStart,
        stock,
        totalParticipations: totalParticipations || 0,
        totalWinners: totalWinners || 0,
        totalClaimed: totalClaimed || 0,
      })
    }

    if (action === 'update_secret_menu') {
      if (!menuData) return errorResponse('missing_data', 'Données du menu requises')

      const cleanText = (value: unknown, max: number) => {
        if (typeof value !== 'string') return null
        const text = value.trim()
        return text ? text.slice(0, max) : null
      }
      const cleanDate = (value: unknown) => {
        if (typeof value !== 'string' || !value.trim()) return null
        const date = new Date(value)
        return Number.isNaN(date.getTime()) ? null : date.toISOString()
      }

      const { data: weekStart, error: weekError } = await supabase.rpc('get_current_week_start')
      if (weekError || !weekStart) return serverErrorResponse()

      let targetMenuId = menuId || null
      if (!targetMenuId) {
        const { data: existingMenu } = await supabase.from('secret_menu').select('id').eq('week_start', weekStart).limit(1).maybeSingle()
        targetMenuId = existingMenu?.id || null
      }

      const payload = {
        week_start: weekStart,
        menu_name: cleanText(menuData.menu_name, 100) || 'Menu secret de la semaine',
        secret_code: cleanText(menuData.secret_code, 20)?.toUpperCase() || 'SECRET',
        galette_special: cleanText(menuData.galette_special, 100),
        galette_special_description: cleanText(menuData.galette_special_description, 500),
        galette_special_price: cleanText(menuData.galette_special_price, 20),
        galette_special_image_url: cleanText(menuData.galette_special_image_url, 1000),
        galette_special_video_url: cleanText(menuData.galette_special_video_url, 1000),
        crepe_special: cleanText(menuData.crepe_special, 100),
        crepe_special_description: cleanText(menuData.crepe_special_description, 500),
        crepe_special_price: cleanText(menuData.crepe_special_price, 20),
        crepe_special_image_url: cleanText(menuData.crepe_special_image_url, 1000),
        crepe_special_video_url: cleanText(menuData.crepe_special_video_url, 1000),
        valid_from: cleanDate(menuData.valid_from),
        valid_to: cleanDate(menuData.valid_to),
        is_active: typeof menuData.is_active === 'boolean' ? menuData.is_active : true,
        updated_at: new Date().toISOString(),
      }

      const query = targetMenuId
        ? supabase.from('secret_menu').update(payload).eq('id', targetMenuId).select().single()
        : supabase.from('secret_menu').insert(payload).select().single()
      const { data, error } = await query
      if (error) return errorResponse('save_failed', `Sauvegarde impossible : ${error.message}`, 400)

      await writeAuditLog(supabase, admin, targetMenuId ? 'secret_menu.update' : 'secret_menu.create', 'secret_menu', data.id)
      return successResponse({ success: true, menu: data })
    }

    if (action === 'update_carte_public') {
      const carteId = typeof body.carteId === 'string' ? body.carteId : ''
      const carteData = body.carteData && typeof body.carteData === 'object' && !Array.isArray(body.carteData)
        ? body.carteData as JsonRecord
        : null
      if (!carteId || !carteData) return errorResponse('missing_data', 'Données requises')

      const { data, error } = await supabase.from('carte_public').update({
        galette_items: Array.isArray(carteData.galette_items) ? carteData.galette_items : [],
        crepe_items: Array.isArray(carteData.crepe_items) ? carteData.crepe_items : [],
        updated_at: new Date().toISOString(),
      }).eq('id', carteId).select().single()

      if (error) return serverErrorResponse()
      await writeAuditLog(supabase, admin, 'public_menu.update', 'carte_public', carteId)
      return successResponse({ success: true, carte: data })
    }

    if (action === 'validate_daily_code') {
      if (!code) return errorResponse('missing_code', 'Code requis')
      const { data: menu, error } = await supabase.from('secret_menu')
        .select('id, secret_code, valid_from, valid_to, is_active')
        .eq('is_active', true)
        .order('week_start', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error || !menu) return successResponse({ valid: false, message: 'Aucun menu secret actif' })
      const now = new Date()
      if (menu.valid_from && now < new Date(menu.valid_from)) return successResponse({ valid: false, message: 'Menu secret pas encore disponible' })
      if (menu.valid_to && now > new Date(menu.valid_to)) return successResponse({ valid: false, message: 'Menu secret expiré' })

      const { data: dailyCode } = await supabase.rpc('get_daily_code', { p_secret_code: menu.secret_code })
      const valid = code === dailyCode?.toUpperCase() || code === menu.secret_code?.toUpperCase()
      return successResponse({ valid, message: valid ? 'Code valide' : 'Code incorrect' })
    }

    if (action === 'get_security_token') {
      return successResponse({ token: generateSecurityToken(), validFor: 10 - (Math.floor(Date.now() / 1000) % 10) })
    }

    if (action === 'get_secret_menu') {
      const { data: weekStart, error: weekError } = await supabase.rpc('get_current_week_start')
      if (weekError || !weekStart) return serverErrorResponse()

      const { data: currentWeekMenu, error: currentError } = await supabase.from('secret_menu').select('*').eq('week_start', weekStart).limit(1).maybeSingle()
      if (currentError) return serverErrorResponse()
      if (currentWeekMenu) return successResponse({ menu: currentWeekMenu })

      const { data: menu, error } = await supabase.from('secret_menu').select('*').order('week_start', { ascending: false }).limit(1).maybeSingle()
      if (error) return serverErrorResponse()
      return successResponse({ menu })
    }

    if (action === 'list_messages') {
      const { data: messages, error } = await supabase.from('messages')
        .select('id, sender_type, sender_name, sender_email, sender_phone, subject, message, is_read, created_at')
        .order('created_at', { ascending: false })
        .limit(50)
      if (error) return serverErrorResponse()
      return successResponse({ messages })
    }

    if (action === 'mark_message_read') {
      const messageId = typeof body.messageId === 'string' ? body.messageId : ''
      if (!messageId) return errorResponse('missing_id', 'ID message requis')
      const { error } = await supabase.from('messages').update({ is_read: true }).eq('id', messageId)
      if (error) return serverErrorResponse()
      await writeAuditLog(supabase, admin, 'message.read', 'message', messageId)
      return successResponse({ success: true })
    }

    if (action === 'get_admin_setting') {
      const settingKey = typeof body.settingKey === 'string' ? body.settingKey.trim() : ''
      if (!settingKey) return errorResponse('missing_key', 'Clé de réglage requise')
      const { data, error } = await supabase.from('admin_settings').select('*').eq('setting_key', settingKey).maybeSingle()
      if (error) return serverErrorResponse()
      return successResponse({ setting: data })
    }

    if (action === 'update_admin_setting') {
      const settingKey = typeof body.settingKey === 'string' ? body.settingKey.trim() : ''
      if (!settingKey) return errorResponse('missing_key', 'Clé de réglage requise')
      const patch = body.settingPatch && typeof body.settingPatch === 'object' && !Array.isArray(body.settingPatch)
        ? body.settingPatch as JsonRecord
        : null
      if (!patch) return errorResponse('missing_data', 'Réglage requis')

      const allowedPatch = {
        is_active: typeof patch.is_active === 'boolean' ? patch.is_active : undefined,
        setting_value: patch.setting_value ?? undefined,
        updated_at: new Date().toISOString(),
      }
      const { data, error } = await supabase.from('admin_settings').update(allowedPatch).eq('setting_key', settingKey).select().single()
      if (error) return serverErrorResponse()
      await writeAuditLog(supabase, admin, 'admin_setting.update', 'admin_setting', settingKey)
      return successResponse({ success: true, setting: data })
    }

    return errorResponse('invalid_action', 'Action non reconnue')
  } catch (error: unknown) {
    console.error('Admin scan error:', error instanceof Error ? error.message : 'Unknown')
    return serverErrorResponse()
  }
})

function generateSecurityToken(): string {
  const now = Math.floor(Date.now() / 10000)
  const hash = ((now * 9301 + 49297) % 233280).toString()
  return hash.padStart(4, '0').slice(-4)
}
