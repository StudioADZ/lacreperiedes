-- =====================================================
-- SAFE PATCH: Secret menu media/price columns + public view update
-- =====================================================

-- 1) Add columns (non-destructive)
ALTER TABLE public.secret_menu
  ADD COLUMN IF NOT EXISTS galette_special_price text,
  ADD COLUMN IF NOT EXISTS galette_special_image_url text,
  ADD COLUMN IF NOT EXISTS galette_special_video_url text,
  ADD COLUMN IF NOT EXISTS crepe_special_price text,
  ADD COLUMN IF NOT EXISTS crepe_special_image_url text,
  ADD COLUMN IF NOT EXISTS crepe_special_video_url text;

-- 2) Update public view WITHOUT security_invoker (prevents privilege leakage patterns)
-- Prefer CREATE OR REPLACE to avoid breaking dependencies
CREATE OR REPLACE VIEW public.secret_menu_public AS
SELECT 
  id,
  week_start,
  menu_name,
  is_active,

  galette_special,
  galette_special_description,
  galette_special_price,
  galette_special_image_url,
  galette_special_video_url,

  crepe_special,
  crepe_special_description,
  crepe_special_price,
  crepe_special_image_url,
  crepe_special_video_url,

  galette_items,
  crepe_items,
  valid_from,
  valid_to,
  created_at,
  updated_at
FROM public.secret_menu
WHERE is_active = true
  -- Optionnel (recommandé si tu veux respecter la fenêtre de validité)
  AND (valid_from IS NULL OR valid_from <= now())
  AND (valid_to   IS NULL OR valid_to   >= now());

-- 3) Ensure the view is readable publicly
GRANT SELECT ON public.secret_menu_public TO anon, authenticated;

-- 4) Hardening reminder (only if not already applied elsewhere):
-- Keep table access restricted so secret_code can't be read directly.
-- (If you've already done this, leaving it here is harmless.)
REVOKE ALL ON TABLE public.secret_menu FROM anon, authenticated;
