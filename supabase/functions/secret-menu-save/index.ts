import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const jsonResponse = (body: unknown, status = 200) => {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  })
}

const clean = (value: unknown, max: number) => {
  if (typeof value !== 'string') return null

  const text = value.trim()
  return text ? text.slice(0, max) : null
}

const cleanDate = (value: unknown) => {
  if (typeof value !== 'string') return null

  const text = value.trim()
  if (!text) return null

  const date = new Date(text)
  if (Number.isNaN(date.getTime())) return null

  return date.toISOString()
}

const getWeekStart = () => {
  const date = new Date()
  const day = date.getUTCDay()
  const diff = day === 0 ? 6 : day - 1

  date.setUTCDate(date.getUTCDate() - diff)
  date.setUTCHours(0, 0, 0, 0)

  return date.toISOString().slice(0, 10)
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey =
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ||
      Deno.env.get('SUPABASE_SECRET_KEYS')

    if (!supabaseUrl || !serviceRoleKey) {
      return jsonResponse(
        {
          success: false,
          error: 'missing_supabase_config',
          message: 'Configuration Supabase manquante côté fonction.',
        },
        500,
      )
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey)

    const body = await req.json().catch(() => null)

    if (!body || typeof body !== 'object') {
      return jsonResponse(
        {
          success: false,
          error: 'invalid_body',
          message: 'Requête invalide.',
        },
        400,
      )
    }

    const { menuId, menuData } = body as {
      menuId?: string
      menuData?: Record<string, unknown>
    }

    if (!menuData) {
      return jsonResponse(
        {
          success: false,
          error: 'missing_menu_data',
          message: 'Données du menu manquantes.',
        },
        400,
      )
    }

    let targetId = menuId || null

    if (!targetId) {
      const { data: existing, error: lookupError } = await supabase
        .from('secret_menu')
        .select('id')
        .order('week_start', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (lookupError) {
        return jsonResponse(
          {
            success: false,
            error: 'lookup_failed',
            message: `Lecture du menu impossible : ${lookupError.message}`,
          },
          500,
        )
      }

      targetId = existing?.id || null
    }

    const payload = {
      week_start: getWeekStart(),
      menu_name: clean(menuData.menu_name, 100) || 'Menu secret de la semaine',
      secret_code: 'SECRET',

      galette_special: clean(menuData.galette_special, 100),
      galette_special_description: clean(menuData.galette_special_description, 500),
      galette_special_price: clean(menuData.galette_special_price, 20),
      galette_special_image_url: clean(menuData.galette_special_image_url, 1000),
      galette_special_video_url: clean(menuData.galette_special_video_url, 1000),

      crepe_special: clean(menuData.crepe_special, 100),
      crepe_special_description: clean(menuData.crepe_special_description, 500),
      crepe_special_price: clean(menuData.crepe_special_price, 20),
      crepe_special_image_url: clean(menuData.crepe_special_image_url, 1000),
      crepe_special_video_url: clean(menuData.crepe_special_video_url, 1000),

      valid_from: cleanDate(menuData.valid_from),
      valid_to: cleanDate(menuData.valid_to),
      is_active: typeof menuData.is_active === 'boolean' ? menuData.is_active : true,
      updated_at: new Date().toISOString(),
    }

    if (targetId) {
      const { data, error } = await supabase
        .from('secret_menu')
        .update(payload)
        .eq('id', targetId)
        .select()
        .single()

      if (error) {
        return jsonResponse(
          {
            success: false,
            error: 'update_failed',
            message: `Sauvegarde impossible : ${error.message}`,
          },
          500,
        )
      }

      return jsonResponse({
        success: true,
        menu: data,
      })
    }

    const { data, error } = await supabase
      .from('secret_menu')
      .insert(payload)
      .select()
      .single()

    if (error) {
      return jsonResponse(
        {
          success: false,
          error: 'insert_failed',
          message: `Création impossible : ${error.message}`,
        },
        500,
      )
    }

    return jsonResponse({
      success: true,
      menu: data,
    })
  } catch (error) {
    return jsonResponse(
      {
        success: false,
        error: 'unexpected_error',
        message: error instanceof Error ? error.message : 'Erreur inconnue.',
      },
      500,
    )
  }
})
