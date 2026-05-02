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
  v_loss_code_exists boolean;
BEGIN
  v_normalized_code := upper(trim(p_code));

  IF v_normalized_code = '' THEN
    RETURN false;
  END IF;

  SELECT * INTO v_menu
  FROM public.secret_menu
  WHERE is_active = true
    AND (valid_from IS NULL OR now() >= valid_from)
    AND (valid_to IS NULL OR now() <= valid_to)
  ORDER BY week_start DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  IF v_menu.secret_code IS NOT NULL AND v_normalized_code = upper(v_menu.secret_code) THEN
    RETURN true;
  END IF;

  v_daily_code := public.get_daily_code(v_menu.week_start);
  IF v_daily_code IS NOT NULL AND v_normalized_code = upper(v_daily_code) THEN
    RETURN true;
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.quiz_participations
    WHERE upper(prize_code) = v_normalized_code
      AND week_start = v_menu.week_start
      AND prize_won IS NOT NULL
      AND status <> 'invalidated'
  ) INTO v_prize_exists;

  IF v_prize_exists THEN
    RETURN true;
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.secret_access
    WHERE upper(secret_code) = v_normalized_code
      AND week_start = v_menu.week_start::text
      AND expires_at > now()
  ) INTO v_loss_code_exists;

  IF v_loss_code_exists THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$;