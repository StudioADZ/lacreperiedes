import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, errorResponse, successResponse, serverErrorResponse } from '../_shared/validation.ts'

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const ADMIN_PASSWORD = Deno.env.get('ADMIN_PASSWORD')
    
    if (!ADMIN_PASSWORD) {
      console.error('ADMIN_PASSWORD not configured')
      return serverErrorResponse()
    }

    const body = await req.json()
    const { adminPassword, action, settingKey, isActive, settingValue } = body

    // Authenticate admin
    if (!adminPassword || adminPassword !== ADMIN_PASSWORD) {
      return errorResponse('unauthorized', 'Mot de passe incorrect', 401)
    }

    // Validate settingKey
    if (!settingKey || typeof settingKey !== 'string' || settingKey.length > 50) {
      return errorResponse('invalid_input', 'Clé de paramètre invalide', 400)
    }

    // Create service role client for bypassing RLS
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Handle different actions
    if (action === 'get') {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('*')
        .eq('setting_key', settingKey)
        .maybeSingle()

      if (error) {
        console.error('Error fetching setting:', error)
        return serverErrorResponse()
      }

      return successResponse({ setting: data })
    }

    if (action === 'update') {
      const { error } = await supabase
        .from('admin_settings')
        .update({ 
          is_active: Boolean(isActive),
          setting_value: settingValue || {},
          updated_at: new Date().toISOString()
        })
        .eq('setting_key', settingKey)

      if (error) {
        console.error('Error updating setting:', error)
        return serverErrorResponse()
      }

      return successResponse({ success: true })
    }

    return errorResponse('invalid_action', 'Action non reconnue', 400)

  } catch (error) {
    console.error('Admin settings error:', error)
    return serverErrorResponse()
  }
})
