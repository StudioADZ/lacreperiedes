import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, errorResponse, successResponse, serverErrorResponse } from '../_shared/validation.ts'

const ADMIN_PASSWORD = Deno.env.get('ADMIN_PASSWORD')

const clean = (value: unknown, max: number) => {
  if (typeof value !== 'string') return null
  const text = value.trim()
  return text ? text.slice(0, max) : null
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const body = await req.json()
    const { adminPassword, menuId, menuData } = body

    if (!ADMIN_PASSWORD || adminPassword !== ADMIN_PASSWORD) {
      return errorResponse('unauthorized', 'Mot de passe incorrect', 401)
    }

    if (!menuData) {
      return errorResponse('missing_data', 'Données du menu requises')
    }

    let targetId = menuId

    if (!targetId) {
      const { data: existing, error: lookupError } = await supabase
        .from('secret_menu')
        .select('id')
        .order('week_start', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (lookupError) return serverErrorResponse()
      targetId = existing?.id
    }

    if (!targetId) {
      const { data: created, error: createError } = await supabase
        .from('secret_menu')
        .insert({
          week_start: new Date().toISOString().slice(0, 10),
          menu_name: 'Menu secret de la semaine',
          secret_code: 'SECRET',
          is_active: true,
        })
        .select('id')
        .single()

      if (createError) {
        return errorResponse('create_failed', 'Création du menu impossible', 400)
      }

      targetId = created.id
    }

    const payload = {
      menu_name: clean(menuData.menu_name, 100) || 'Menu secret de la semaine',
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
      valid_from: menuData.valid_from ? new Date(menuData.valid_from).toISOString() : null,
      valid_to: menuData.valid_to ? new Date(menuData.valid_to).toISOString() : null,
      is_active: menuData.is_active ?? true,
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from('secret_menu')
      .update(payload)
      .eq('id', targetId)
      .select()
      .single()

    if (error) {
      return errorResponse('save_failed', 'Sauvegarde impossible', 400)
    }

    return successResponse({ success: true, menu: data })
  } catch (_) {
    return serverErrorResponse()
  }
})
