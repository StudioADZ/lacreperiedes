-- Add price, image, and video columns for secret menu specials
ALTER TABLE public.secret_menu ADD COLUMN IF NOT EXISTS galette_special_price text;
ALTER TABLE public.secret_menu ADD COLUMN IF NOT EXISTS galette_special_image_url text;
ALTER TABLE public.secret_menu ADD COLUMN IF NOT EXISTS galette_special_video_url text;
ALTER TABLE public.secret_menu ADD COLUMN IF NOT EXISTS crepe_special_price text;
ALTER TABLE public.secret_menu ADD COLUMN IF NOT EXISTS crepe_special_image_url text;
ALTER TABLE public.secret_menu ADD COLUMN IF NOT EXISTS crepe_special_video_url text;

-- Update the public view to include new columns (but NOT secret_code for security)
DROP VIEW IF EXISTS public.secret_menu_public;
CREATE VIEW public.secret_menu_public WITH (security_invoker = on) AS
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
FROM public.secret_menu;