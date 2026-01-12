import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { 
  corsHeaders, 
  isValidPrizeCode,
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

    const { code } = await req.json()

    if (!code) {
      return errorResponse('missing_code', 'Code requis')
    }

    // Validate code format
    if (!isValidPrizeCode(code)) {
      return errorResponse('invalid_code', 'Format de code invalide')
    }

    // Find participation by code - only select non-sensitive fields
    const { data: participation, error } = await supabase
      .from('quiz_participations')
      .select('first_name, prize_won, week_start, prize_claimed, claimed_at')
      .eq('prize_code', code.toUpperCase())
      .maybeSingle()

    if (error) {
      console.error('Prize lookup error')
      return serverErrorResponse()
    }

    if (!participation) {
      return successResponse({ 
        valid: false, 
        message: 'Code non trouvé' 
      })
    }

    // Calculate week number for display
    const weekDate = new Date(participation.week_start)
    const startOfYear = new Date(weekDate.getFullYear(), 0, 1)
    const weekNumber = Math.ceil(((weekDate.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7)

    // Return ONLY non-sensitive information
    return successResponse({
      valid: true,
      firstName: participation.first_name,
      prize: participation.prize_won,
      weekNumber,
      claimed: participation.prize_claimed,
      claimedAt: participation.claimed_at
      // NOTE: email, phone, device_fingerprint, internal IDs are NOT returned
    })

  } catch (error: unknown) {
    console.error('Verify prize error:', error instanceof Error ? error.message : 'Unknown')
    return serverErrorResponse()
  }
})