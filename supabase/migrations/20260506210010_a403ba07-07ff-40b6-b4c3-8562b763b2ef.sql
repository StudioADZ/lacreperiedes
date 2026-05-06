
-- 3. Remove quiz_participations from realtime to prevent PII leak
ALTER PUBLICATION supabase_realtime DROP TABLE public.quiz_participations;

-- 4. Fix security definer view: recreate with SECURITY INVOKER
DROP VIEW IF EXISTS public.secret_menu_public;
CREATE VIEW public.secret_menu_public
WITH (security_invoker = true)
AS
SELECT id, week_start, menu_name,
  galette_special, galette_special_description, galette_special_price,
  galette_special_image_url, galette_special_video_url,
  crepe_special, crepe_special_description, crepe_special_price,
  crepe_special_image_url, crepe_special_video_url,
  galette_items, crepe_items, is_active, valid_from, valid_to,
  created_at, updated_at
FROM public.secret_menu
WHERE is_active = true;

-- 5. Fix get_daily_code: add permission check
CREATE OR REPLACE FUNCTION public.get_daily_code(p_week_start date DEFAULT NULL::date)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_menu record;
  v_seed text;
  v_today text;
  v_hash text;
  v_code text;
BEGIN
  IF NOT (
    current_setting('role', true) = 'service_role'
    OR public.has_role(auth.uid(), 'admin')
  ) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT * INTO v_menu 
  FROM secret_menu 
  WHERE is_active = true 
    AND (p_week_start IS NULL OR week_start = p_week_start)
  ORDER BY week_start DESC 
  LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;
  
  v_seed := COALESCE(v_menu.daily_code_seed, v_menu.secret_code);
  v_today := to_char(CURRENT_DATE, 'YYYY-MM-DD');
  v_hash := encode(digest(v_seed || v_today, 'md5'), 'hex');
  v_code := upper(substring(v_hash from 1 for 4)) || to_char(CURRENT_DATE, 'DD');
  
  RETURN v_code;
END;
$$;

-- 6. Fix admin_settings: restrict reads to service_role only
DROP POLICY IF EXISTS "Anyone can read settings" ON public.admin_settings;
DROP POLICY IF EXISTS "Service role can read settings" ON public.admin_settings;

CREATE POLICY "Service role can read settings"
ON public.admin_settings FOR SELECT TO service_role
USING (true);
