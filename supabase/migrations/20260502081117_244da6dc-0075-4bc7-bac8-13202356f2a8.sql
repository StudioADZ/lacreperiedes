
-- Drop existing view first
DROP VIEW IF EXISTS public.secret_menu_public;

-- Recreate with correct columns
CREATE VIEW public.secret_menu_public AS
SELECT
  id, week_start, menu_name,
  galette_special, galette_special_description, galette_special_price,
  galette_special_image_url, galette_special_video_url,
  crepe_special, crepe_special_description, crepe_special_price,
  crepe_special_image_url, crepe_special_video_url,
  galette_items, crepe_items,
  is_active, valid_from, valid_to,
  created_at, updated_at
FROM public.secret_menu
WHERE is_active = true;

GRANT SELECT ON public.secret_menu_public TO anon, authenticated;

-- Update validate_secret_code to also accept quiz prize_code
CREATE OR REPLACE FUNCTION public.validate_secret_code(p_code text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
DECLARE
  v_menu record;
  v_daily_code text;
  v_normalized_code text;
  v_prize_exists boolean;
BEGIN
  v_normalized_code := upper(trim(p_code));

  SELECT * INTO v_menu
  FROM secret_menu
  WHERE is_active = true
    AND (valid_from IS NULL OR now() >= valid_from)
    AND (valid_to IS NULL OR now() <= valid_to)
  ORDER BY week_start DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  IF v_normalized_code = upper(v_menu.secret_code) THEN
    RETURN true;
  END IF;

  v_daily_code := get_daily_code(v_menu.week_start);
  IF v_daily_code IS NOT NULL AND v_normalized_code = upper(v_daily_code) THEN
    RETURN true;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM quiz_participations
    WHERE upper(prize_code) = v_normalized_code
      AND week_start = v_menu.week_start
      AND status = 'winner'
  ) INTO v_prize_exists;

  IF v_prize_exists THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$;
