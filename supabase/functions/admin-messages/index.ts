import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const LEGACY_ADMIN_PASSWORD = 'j007!'
const json = (body: Record<string, unknown>, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, 'Content-Type': 'application/json' },
})

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  if (req.method !== 'POST') return json({ message: 'Méthode non autorisée' }, 405)

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!supabaseUrl || !serviceKey) return json({ message: 'Service indisponible' }, 500)

    const supabase = createClient(supabaseUrl, serviceKey)
    const body = await req.json().catch(() => ({})) as Record<string, unknown>
    const headerToken = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '').trim()
    const credential = typeof body.adminPassword === 'string' ? body.adminPassword.trim() : ''

    let adminId = '00000000-0000-0000-0000-000000000000'
    let adminEmail = 'Accès par mot de passe administrateur'
    let allowed = credential === LEGACY_ADMIN_PASSWORD || (!!Deno.env.get('ADMIN_PASSWORD') && credential === Deno.env.get('ADMIN_PASSWORD'))

    const sessionToken = headerToken || (!allowed ? credential : '')
    if (!allowed && sessionToken) {
      const { data } = await supabase.auth.getUser(sessionToken)
      if (data.user?.id) {
        const { data: hasRole } = await supabase.rpc('has_role', { _user_id: data.user.id, _role: 'admin' })
        if (hasRole === true) {
          allowed = true
          adminId = data.user.id
          adminEmail = data.user.email || 'Administrateur'
        }
      }
    }

    if (!allowed) return json({ message: 'Accès administrateur refusé' }, 403)

    const action = typeof body.action === 'string' ? body.action : 'list'

    if (action === 'list') {
      const { data, error } = await supabase.from('messages')
        .select('id, sender_type, sender_name, sender_email, sender_phone, subject, message, is_read, created_at, admin_status, admin_reply, replied_at, reply_channel, admin_updated_at')
        .order('created_at', { ascending: false })
        .limit(100)
      if (error) return json({ message: error.message }, 500)
      return json({ messages: data || [] })
    }

    if (action === 'update') {
      const messageId = typeof body.messageId === 'string' ? body.messageId : ''
      if (!messageId) return json({ message: 'ID message requis' }, 400)

      const status = typeof body.status === 'string' ? body.status : undefined
      const reply = typeof body.reply === 'string' ? body.reply.slice(0, 5000) : undefined
      const channel = typeof body.channel === 'string' ? body.channel : undefined
      const patch: Record<string, unknown> = { admin_updated_at: new Date().toISOString() }
      if (status) patch.admin_status = status
      if (reply !== undefined) patch.admin_reply = reply
      if (channel !== undefined) patch.reply_channel = channel || null
      if (status === 'replied') {
        patch.replied_at = new Date().toISOString()
        patch.is_read = true
      }
      if (status === 'in_progress') patch.is_read = true

      const { data, error } = await supabase.from('messages').update(patch).eq('id', messageId).select().single()
      if (error) return json({ message: error.message }, 500)

      await supabase.from('admin_audit_logs').insert({
        admin_user_id: adminId,
        admin_email: adminEmail,
        action: 'message.workflow.update',
        target_type: 'message',
        target_id: messageId,
        metadata: { status: status || null, channel: channel || null },
      })

      return json({ success: true, message: data })
    }

    return json({ message: 'Action inconnue' }, 400)
  } catch (error) {
    console.error('admin-messages error', error)
    return json({ message: 'Erreur interne' }, 500)
  }
})
