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

const verifyAdmin = async (req: Request, body: Record<string, unknown>, supabase: ReturnType<typeof createClient>, supabaseUrl: string) => {
  const headerToken = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '').trim()
  if (headerToken) {
    const { data } = await supabase.auth.getUser(headerToken)
    if (data.user?.id) {
      const { data: hasRole } = await supabase.rpc('has_role', { _user_id: data.user.id, _role: 'admin' })
      if (hasRole === true) return true
    }
  }

  const credential = typeof body.adminPassword === 'string' ? body.adminPassword : ''
  if (!credential) return false
  const response = await fetch(`${supabaseUrl}/functions/v1/admin-overview`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ adminPassword: credential }),
  }).catch(() => null)
  return response?.ok === true
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
    if (!await verifyAdmin(req, body, supabase, supabaseUrl)) return json({ message: 'Accès administrateur refusé' }, 403)

    const action = typeof body.action === 'string' ? body.action : 'get'

    if (action === 'get') {
      const { data: weekStart } = await supabase.rpc('get_current_week_start')
      const { data, error } = await supabase.from('secret_menu').select('*').eq('week_start', weekStart).limit(1).maybeSingle()
      if (error) return json({ message: error.message }, 500)
      if (data) return json({ proposal: data })

      const { data: latest, error: latestError } = await supabase.from('secret_menu').select('*').order('week_start', { ascending: false }).limit(1).maybeSingle()
      if (latestError) return json({ message: latestError.message }, 500)
      return json({ proposal: latest })
    }

    if (action === 'save') {
      const proposal = body.proposal && typeof body.proposal === 'object' && !Array.isArray(body.proposal)
        ? body.proposal as Record<string, unknown>
        : null
      if (!proposal) return json({ message: 'Données requises' }, 400)

      const { data: weekStart, error: weekError } = await supabase.rpc('get_current_week_start')
      if (weekError || !weekStart) return json({ message: 'Semaine introuvable' }, 500)

      const payload: Record<string, unknown> = {
        week_start: weekStart,
        menu_name: cleanText(proposal.menu_name, 100) || 'Proposition du moment',
        secret_code: 'PERSONAL',
        valid_from: cleanDate(proposal.valid_from),
        valid_to: cleanDate(proposal.valid_to),
        is_active: proposal.is_active !== false,
        updated_at: new Date().toISOString(),
      }

      for (const type of ['galette', 'crepe', 'milkshake', 'smoothie']) {
        payload[`${type}_special`] = cleanText(proposal[`${type}_special`], 100)
        payload[`${type}_special_description`] = cleanText(proposal[`${type}_special_description`], 500)
        payload[`${type}_special_price`] = cleanText(proposal[`${type}_special_price`], 20)
        payload[`${type}_special_image_url`] = cleanText(proposal[`${type}_special_image_url`], 1000)
        payload[`${type}_special_video_url`] = cleanText(proposal[`${type}_special_video_url`], 1000)
      }

      const proposalId = typeof body.proposalId === 'string' ? body.proposalId : ''
      let query
      if (proposalId) query = supabase.from('secret_menu').update(payload).eq('id', proposalId).select().single()
      else {
        const { data: existing } = await supabase.from('secret_menu').select('id').eq('week_start', weekStart).limit(1).maybeSingle()
        query = existing?.id
          ? supabase.from('secret_menu').update(payload).eq('id', existing.id).select().single()
          : supabase.from('secret_menu').insert(payload).select().single()
      }

      const { data, error } = await query
      if (error) return json({ message: error.message }, 400)
      return json({ success: true, proposal: data })
    }

    return json({ message: 'Action inconnue' }, 400)
  } catch (error) {
    return json({ message: error instanceof Error ? error.message : 'Erreur interne' }, 500)
  }
})
