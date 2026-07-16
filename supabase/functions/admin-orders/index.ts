import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (body: Record<string, unknown>, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, 'Content-Type': 'application/json' },
})

const verifyAdmin = async (req: Request, body: Record<string, unknown>, supabase: ReturnType<typeof createClient>) => {
  const token = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '').trim()
    || (typeof body.adminPassword === 'string' ? body.adminPassword.trim() : '')
  if (!token) return null
  const { data } = await supabase.auth.getUser(token)
  if (!data.user?.id) return null
  const { data: allowed } = await supabase.rpc('has_role', { _user_id: data.user.id, _role: 'admin' })
  return allowed === true ? data.user : null
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  if (req.method !== 'POST') return json({ message: 'Méthode non autorisée' }, 405)

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!supabaseUrl || !serviceKey) return json({ message: 'Service indisponible' }, 500)
    const supabase = createClient(supabaseUrl, serviceKey)
    const body = await req.json().catch(() => ({})) as Record<string, unknown>
    const admin = await verifyAdmin(req, body, supabase)
    if (!admin) return json({ message: 'Accès administrateur refusé' }, 403)

    const action = typeof body.action === 'string' ? body.action : 'list'
    if (action === 'list') {
      const { data, error } = await supabase.from('click_collect_orders').select('*').order('created_at', { ascending: false }).limit(250)
      if (error) return json({ message: error.message }, 500)
      return json({ orders: data || [] })
    }

    if (action === 'update_status') {
      const id = typeof body.id === 'string' ? body.id : ''
      const status = typeof body.status === 'string' ? body.status : ''
      const allowed = ['pending','confirmed','preparing','ready','collected','cancelled']
      if (!id || !allowed.includes(status)) return json({ message: 'Statut invalide' }, 400)
      const { data, error } = await supabase.from('click_collect_orders').update({ status, updated_at: new Date().toISOString() }).eq('id', id).select().single()
      if (error) return json({ message: error.message }, 500)
      await supabase.from('admin_audit_logs').insert({ admin_user_id: admin.id, admin_email: admin.email || null, action: 'order.status', target_type: 'click_collect_order', target_id: id, metadata: { status } })
      return json({ order: data })
    }

    return json({ message: 'Action inconnue' }, 400)
  } catch (error) {
    return json({ message: error instanceof Error ? error.message : 'Erreur interne' }, 500)
  }
})