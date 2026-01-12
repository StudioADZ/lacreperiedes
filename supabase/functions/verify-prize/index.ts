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

    const { code } = await req.json()

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

    // Calculate week number for display
    const weekDate = new Date(participation.week_start)
    const startOfYear = new Date(weekDate.getFullYear(), 0, 1)
    const weekNumber = Math.ceil(((weekDate.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7)

    return new Response(
      JSON.stringify({
        valid: true,
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

  } catch (error: unknown) {
    console.error('Verify prize error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: 'server_error', message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})