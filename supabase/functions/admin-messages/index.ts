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
    const { adminPassword, action, messageId } = body

    // Authenticate admin
    if (!adminPassword || adminPassword !== ADMIN_PASSWORD) {
      return errorResponse('unauthorized', 'Mot de passe incorrect', 401)
    }

    // Create service role client for bypassing RLS
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Handle different actions
    if (action === 'list') {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) {
        console.error('Error fetching messages:', error)
        return serverErrorResponse()
      }

      return successResponse({ messages: data || [] })
    }

    if (action === 'mark_read' && messageId) {
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('id', messageId)

      if (error) {
        console.error('Error marking as read:', error)
        return serverErrorResponse()
      }

      return successResponse({ success: true })
    }

    return errorResponse('invalid_action', 'Action non reconnue', 400)

  } catch (error) {
    console.error('Admin messages error:', error)
    return serverErrorResponse()
  }
})
