import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Simple admin password check (in production, use proper auth)
const ADMIN_PASSWORD = 'j007!'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { action, code, adminPassword, menuId, menuData } = await req.json()

    // Verify admin password
    if (adminPassword !== ADMIN_PASSWORD) {
      return new Response(
        JSON.stringify({ error: 'unauthorized', message: 'Mot de passe incorrect' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    if (action === 'verify') {
      if (!code) {
        return new Response(
          JSON.stringify({ error: 'missing_code', message: 'Code requis' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }

      // Find participation by code
      const { data: participation, error } = await supabase
        .from('quiz_participations')
        .select('*')
        .eq('prize_code', code.toUpperCase())
        .maybeSingle()

      if (error) throw error

      if (!participation) {
        return new Response(
          JSON.stringify({ 
            valid: false, 
            error: 'not_found', 
            message: 'Code non trouvé' 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Calculate week number
      const weekDate = new Date(participation.week_start)
      const startOfYear = new Date(weekDate.getFullYear(), 0, 1)
      const weekNumber = Math.ceil(((weekDate.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7)

      return new Response(
        JSON.stringify({
          valid: true,
          id: participation.id,
          firstName: participation.first_name,
          prize: participation.prize_won,
          weekNumber,
          weekStart: participation.week_start,
          claimed: participation.prize_claimed,
          claimedAt: participation.claimed_at,
          createdAt: participation.created_at
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'claim') {
      if (!code) {
        return new Response(
          JSON.stringify({ error: 'missing_code', message: 'Code requis' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
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
        .select()
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: 'already_claimed', 
              message: 'Ce lot a déjà été réclamé' 
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        throw error
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Lot marqué comme utilisé',
          participation: data
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'stats') {
      // Get current week stats
      const { data: weekStart } = await supabase.rpc('get_current_week_start')
      
      const { data: stock } = await supabase
        .from('weekly_stock')
        .select('*')
        .eq('week_start', weekStart)
        .maybeSingle()

      const { data: participations } = await supabase
        .from('quiz_participations')
        .select('id, prize_won, prize_claimed')
        .eq('week_start', weekStart)

      const totalParticipations = participations?.length || 0
      const winners = participations?.filter(p => p.prize_won) || []
      const claimed = winners.filter(p => p.prize_claimed).length

      return new Response(
        JSON.stringify({
          weekStart,
          stock,
          totalParticipations,
          totalWinners: winners.length,
          totalClaimed: claimed
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'update_secret_menu') {
      if (!menuId || !menuData) {
        return new Response(
          JSON.stringify({ error: 'missing_data', message: 'Données requises' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }

      const { data, error } = await supabase
        .from('secret_menu')
        .update({
          menu_name: menuData.menu_name,
          secret_code: menuData.secret_code,
          galette_special: menuData.galette_special || null,
          galette_special_description: menuData.galette_special_description || null,
          crepe_special: menuData.crepe_special || null,
          crepe_special_description: menuData.crepe_special_description || null,
          galette_items: menuData.galette_items || [],
          crepe_items: menuData.crepe_items || [],
          valid_from: menuData.valid_from ? new Date(menuData.valid_from).toISOString() : null,
          valid_to: menuData.valid_to ? new Date(menuData.valid_to).toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', menuId)
        .select()
        .single()

      if (error) throw error

      return new Response(
        JSON.stringify({ success: true, menu: data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'invalid_action' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )

  } catch (error: unknown) {
    console.error('Admin scan error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: 'server_error', message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})