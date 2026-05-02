CREATE OR REPLACE FUNCTION public.verify_secret_access(p_token text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.secret_access
    WHERE access_token = p_token
      AND expires_at > now()
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.grant_secret_access(
  p_email text,
  p_phone text,
  p_first_name text,
  p_secret_code text,
  p_week_start text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_token text;
  v_existing text;
BEGIN
  SELECT access_token INTO v_existing
  FROM public.secret_access
  WHERE email = p_email
    AND phone = p_phone
    AND week_start = p_week_start
    AND expires_at > now()
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_existing IS NOT NULL THEN
    RETURN v_existing;
  END IF;

  v_token := public.generate_access_token();

  INSERT INTO public.secret_access (
    email,
    phone,
    first_name,
    access_token,
    secret_code,
    week_start,
    expires_at
  )
  VALUES (
    p_email,
    p_phone,
    p_first_name,
    v_token,
    upper(trim(p_secret_code)),
    p_week_start,
    now() + interval '1 hour'
  );

  RETURN v_token;
END;
$$;

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
      AND status IN ('winner', 'claimed')
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