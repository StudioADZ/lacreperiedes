import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { 
  corsHeaders, 
  isValidPrizeCode,
  isValidName,
  errorResponse,
  successResponse,
  serverErrorResponse,
  sanitizeForLog
} from '../_shared/validation.ts'

// Admin password from environment variable
const ADMIN_PASSWORD = Deno.env.get('ADMIN_PASSWORD')

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const body = await req.json()
    const { action, code, adminPassword, menuId, menuData, participationId } = body

    // Log sanitized request (no passwords/codes)
    console.log('Admin request:', sanitizeForLog({ action, menuId, participationId }))

    // Verify admin password
    if (!ADMIN_PASSWORD || adminPassword !== ADMIN_PASSWORD) {
      return errorResponse('unauthorized', 'Mot de passe incorrect', 401)
    }

    if (action === 'verify') {
      if (!code) {
        return errorResponse('missing_code', 'Code requis')
      }

      if (!isValidPrizeCode(code)) {
        return errorResponse('invalid_code', 'Format de code invalide')
      }

      // Find participation by code
      const { data: participation, error } = await supabase
        .from('quiz_participations')
        .select('id, first_name, prize_won, week_start, prize_claimed, claimed_at, created_at, status, security_token, token_generated_at')
        .eq('prize_code', code.toUpperCase())
        .maybeSingle()

      if (error) {
        console.error('Admin verify error')
        return serverErrorResponse()
      }

      if (!participation) {
        return successResponse({ 
          valid: false, 
          message: 'Code non trouvé' 
        })
      }

      // Check if invalidated
      if (participation.status === 'invalidated') {
        return successResponse({
          valid: false,
          message: 'Ce coupon a été invalidé pour fraude',
          invalidated: true
        })
      }

      // Calculate week number
      const weekDate = new Date(participation.week_start)
      const startOfYear = new Date(weekDate.getFullYear(), 0, 1)
      const weekNumber = Math.ceil(((weekDate.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7)

      // Calculate expected security token (changes every 10 seconds)
      const currentToken = generateSecurityToken()

      return successResponse({
        valid: true,
        id: participation.id,
        firstName: participation.first_name,
        prize: participation.prize_won,
        weekNumber,
        weekStart: participation.week_start,
        claimed: participation.prize_claimed,
        claimedAt: participation.claimed_at,
        createdAt: participation.created_at,
        expectedToken: currentToken,
        status: participation.status
      })
    }

    if (action === 'claim') {
      if (!code) {
        return errorResponse('missing_code', 'Code requis')
      }

      if (!isValidPrizeCode(code)) {
        return errorResponse('invalid_code', 'Format de code invalide')
      }

      // Check status before claiming
      const { data: existing } = await supabase
        .from('quiz_participations')
        .select('status, prize_claimed')
        .eq('prize_code', code.toUpperCase())
        .maybeSingle()

      if (existing?.status === 'invalidated') {
        return successResponse({ 
          success: false, 
          message: 'Ce coupon a été invalidé' 
        })
      }

      if (existing?.prize_claimed) {
        return successResponse({ 
          success: false, 
          message: 'Ce lot a déjà été réclamé' 
        })
      }

      // Mark as claimed
      const { data, error } = await supabase
        .from('quiz_participations')
        .update({ 
          prize_claimed: true, 
          claimed_at: new Date().toISOString(),
          status: 'claimed'
        })
        .eq('prize_code', code.toUpperCase())
        .eq('prize_claimed', false)
        .select('id, first_name, prize_won')
        .single()

      if (error) {
        console.error('Admin claim error')
        return serverErrorResponse()
      }

      return successResponse({ 
        success: true, 
        message: 'Lot marqué comme utilisé',
        firstName: data.first_name,
        prize: data.prize_won
      })
    }

    if (action === 'invalidate') {
      if (!participationId) {
        return errorResponse('missing_id', 'ID participation requis')
      }

      const { data, error } = await supabase
        .from('quiz_participations')
        .update({ 
          status: 'invalidated',
          prize_claimed: true, // Mark as used so can't be reused
          claimed_at: new Date().toISOString()
        })
        .eq('id', participationId)
        .select('id, first_name')
        .single()

      if (error) {
        console.error('Invalidate error')
        return serverErrorResponse()
      }

      return successResponse({ 
        success: true, 
        message: 'Participation invalidée',
        firstName: data.first_name
      })
    }

    if (action === 'list_participations') {
      // Get recent participations with all details for admin
      const { data: participations, error } = await supabase
        .from('quiz_participations')
        .select('id, created_at, first_name, email, phone, score, total_questions, prize_won, prize_code, prize_claimed, claimed_at, status')
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) {
        console.error('List participations error')
        return serverErrorResponse()
      }

      return successResponse({ participations })
    }

    if (action === 'stats') {
      // Get current week stats
      const { data: weekStart } = await supabase.rpc('get_current_week_start')
      
      const { data: stock } = await supabase
        .from('weekly_stock')
        .select('*')
        .eq('week_start', weekStart)
        .maybeSingle()

      // Get aggregated stats only, no PII
      const { count: totalParticipations } = await supabase
        .from('quiz_participations')
        .select('id', { count: 'exact', head: true })
        .eq('week_start', weekStart)

      const { count: totalWinners } = await supabase
        .from('quiz_participations')
        .select('id', { count: 'exact', head: true })
        .eq('week_start', weekStart)
        .not('prize_won', 'is', null)

      const { count: totalClaimed } = await supabase
        .from('quiz_participations')
        .select('id', { count: 'exact', head: true })
        .eq('week_start', weekStart)
        .eq('prize_claimed', true)

      return successResponse({
        weekStart,
        stock,
        totalParticipations: totalParticipations || 0,
        totalWinners: totalWinners || 0,
        totalClaimed: totalClaimed || 0
      })
    }

    if (action === 'update_secret_menu') {
      if (!menuId || !menuData) {
        return errorResponse('missing_data', 'Données requises')
      }

      // Validate menu data
      if (menuData.menu_name && !isValidName(menuData.menu_name)) {
        return errorResponse('invalid_menu_name', 'Nom de menu invalide')
      }

      const { data, error } = await supabase
        .from('secret_menu')
        .update({
          menu_name: menuData.menu_name?.slice(0, 100),
          secret_code: menuData.secret_code?.toUpperCase().slice(0, 20),
          galette_special: menuData.galette_special?.slice(0, 100) || null,
          galette_special_description: menuData.galette_special_description?.slice(0, 500) || null,
          galette_special_price: menuData.galette_special_price?.slice(0, 20) || null,
          galette_special_image_url: menuData.galette_special_image_url || null,
          galette_special_video_url: menuData.galette_special_video_url || null,
          crepe_special: menuData.crepe_special?.slice(0, 100) || null,
          crepe_special_description: menuData.crepe_special_description?.slice(0, 500) || null,
          crepe_special_price: menuData.crepe_special_price?.slice(0, 20) || null,
          crepe_special_image_url: menuData.crepe_special_image_url || null,
          crepe_special_video_url: menuData.crepe_special_video_url || null,
          valid_from: menuData.valid_from ? new Date(menuData.valid_from).toISOString() : null,
          valid_to: menuData.valid_to ? new Date(menuData.valid_to).toISOString() : null,
          is_active: menuData.is_active !== undefined ? menuData.is_active : true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', menuId)
        .select()
        .single()

      if (error) {
        console.error('Menu update error')
        return serverErrorResponse()
      }

      return successResponse({ success: true, menu: data })
    }

    if (action === 'update_carte_public') {
      const { carteId, carteData } = body

      if (!carteId || !carteData) {
        return errorResponse('missing_data', 'Données requises')
      }

      const { data, error } = await supabase
        .from('carte_public')
        .update({
          galette_items: carteData.galette_items || [],
          crepe_items: carteData.crepe_items || [],
          updated_at: new Date().toISOString(),
        })
        .eq('id', carteId)
        .select()
        .single()

      if (error) {
        console.error('Carte update error:', error)
        return serverErrorResponse()
      }

      return successResponse({ success: true, carte: data })
    }

    if (action === 'validate_daily_code') {
      const { code } = body

      if (!code) {
        return errorResponse('missing_code', 'Code requis')
      }

      // Get active secret menu
      const { data: menu, error: menuError } = await supabase
        .from('secret_menu')
        .select('id, secret_code, valid_from, valid_to, is_active')
        .eq('is_active', true)
        .order('week_start', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (menuError || !menu) {
        return successResponse({ valid: false, message: 'Aucun menu secret actif' })
      }

      // Check if within valid period
      const now = new Date()
      const validFrom = menu.valid_from ? new Date(menu.valid_from) : null
      const validTo = menu.valid_to ? new Date(menu.valid_to) : null

      if (validFrom && now < validFrom) {
        return successResponse({ valid: false, message: 'Menu secret pas encore disponible' })
      }
      if (validTo && now > validTo) {
        return successResponse({ valid: false, message: 'Menu secret expiré' })
      }

      // Get daily code
      const { data: dailyCode } = await supabase.rpc('get_daily_code', { 
        p_secret_code: menu.secret_code 
      })

      // Check if submitted code matches daily code or main secret code
      const isValid = code.toUpperCase() === dailyCode?.toUpperCase() || 
                      code.toUpperCase() === menu.secret_code?.toUpperCase()

      return successResponse({ 
        valid: isValid, 
        message: isValid ? 'Code valide' : 'Code incorrect' 
      })
    }

    if (action === 'get_security_token') {
      // Return current expected security token for verification
      return successResponse({ 
        token: generateSecurityToken(),
        validFor: 10 - (Math.floor(Date.now() / 1000) % 10)
      })
    }

    if (action === 'list_messages') {
      const { data: messages, error } = await supabase
        .from('messages')
        .select('id, sender_type, sender_name, sender_email, sender_phone, subject, message, is_read, created_at')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) {
        console.error('List messages error')
        return serverErrorResponse()
      }

      return successResponse({ messages })
    }

    if (action === 'mark_message_read') {
      const { messageId } = body
      if (!messageId) {
        return errorResponse('missing_id', 'ID message requis')
      }

      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('id', messageId)

      if (error) {
        console.error('Mark read error')
        return serverErrorResponse()
      }

      return successResponse({ success: true })
    }

    return errorResponse('invalid_action', 'Action non reconnue')

  } catch (error: unknown) {
    console.error('Admin scan error:', error instanceof Error ? error.message : 'Unknown')
    return serverErrorResponse()
  }
})

// Generate a 4-digit security token that changes every 10 seconds
function generateSecurityToken(): string {
  const now = Math.floor(Date.now() / 10000) // Changes every 10 seconds
  // Simple hash based on time
  const hash = ((now * 9301 + 49297) % 233280).toString()
  return hash.padStart(4, '0').slice(-4)
}
