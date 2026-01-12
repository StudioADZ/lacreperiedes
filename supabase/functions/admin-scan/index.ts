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
    const { action, code, adminPassword, menuId, menuData } = body

    // Log sanitized request (no passwords/codes)
    console.log('Admin request:', sanitizeForLog({ action, menuId }))

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
        .select('id, first_name, prize_won, week_start, prize_claimed, claimed_at, created_at')
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

      // Calculate week number
      const weekDate = new Date(participation.week_start)
      const startOfYear = new Date(weekDate.getFullYear(), 0, 1)
      const weekNumber = Math.ceil(((weekDate.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7)

      return successResponse({
        valid: true,
        id: participation.id,
        firstName: participation.first_name,
        prize: participation.prize_won,
        weekNumber,
        weekStart: participation.week_start,
        claimed: participation.prize_claimed,
        claimedAt: participation.claimed_at,
        createdAt: participation.created_at
        // NOTE: email, phone NOT returned even to admin via this endpoint
        // Admin can access full data via backend if needed
      })
    }

    if (action === 'claim') {
      if (!code) {
        return errorResponse('missing_code', 'Code requis')
      }

      if (!isValidPrizeCode(code)) {
        return errorResponse('invalid_code', 'Format de code invalide')
      }

      // Mark as claimed
      const { data, error } = await supabase
        .from('quiz_participations')
        .update({ 
          prize_claimed: true, 
          claimed_at: new Date().toISOString() 
        })
        .eq('prize_code', code.toUpperCase())
        .eq('prize_claimed', false)
        .select('id, first_name, prize_won')
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return successResponse({ 
            success: false, 
            message: 'Ce lot a déjà été réclamé' 
          })
        }
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
          crepe_special: menuData.crepe_special?.slice(0, 100) || null,
          crepe_special_description: menuData.crepe_special_description?.slice(0, 500) || null,
          galette_items: menuData.galette_items || [],
          crepe_items: menuData.crepe_items || [],
          valid_from: menuData.valid_from ? new Date(menuData.valid_from).toISOString() : null,
          valid_to: menuData.valid_to ? new Date(menuData.valid_to).toISOString() : null,
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

    return errorResponse('invalid_action', 'Action non reconnue')

  } catch (error: unknown) {
    console.error('Admin scan error:', error instanceof Error ? error.message : 'Unknown')
    return serverErrorResponse()
  }
})