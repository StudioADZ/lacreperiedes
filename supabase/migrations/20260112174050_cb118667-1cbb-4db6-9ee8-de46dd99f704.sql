-- =============================================
-- SAFE SECURITY PATCH - GDPR COMPLIANCE (NON DESTRUCTIVE)
-- =============================================

-- -------------------------------------------------
-- A) quiz_sessions: safe lockdown (edge functions only)
-- -------------------------------------------------
ALTER TABLE public.quiz_sessions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='quiz_sessions'
      AND policyname='No direct session access'
  ) THEN
    DROP POLICY "No direct session access" ON public.quiz_sessions;
  END IF;
END $$;

CREATE POLICY "No direct session access"
ON public.quiz_sessions
FOR ALL
USING (false)
WITH CHECK (false);

-- -------------------------------------------------
-- B) quiz_participations: block direct INSERT (edge function quiz-submit only)
-- -------------------------------------------------
ALTER TABLE public.quiz_participations ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE p TEXT;
BEGIN
  FOREACH p IN ARRAY ARRAY[
    'Anyone can insert participation',
    'Public can insert participation',
    'Public can submit quiz participation'
  ]
  LOOP
    IF EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname='public' AND tablename='quiz_participations'
        AND policyname=p
    ) THEN
      EXECUTE format('DROP POLICY %I ON public.quiz_participations', p);
    END IF;
  END LOOP;
END $$;

-- Only INSERT is blocked here (SELECT policy not touched by this script)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='quiz_participations'
      AND policyname='No direct participation insert'
  ) THEN
    DROP POLICY "No direct participation insert" ON public.quiz_participations;
  END IF;
END $$;

CREATE POLICY "No direct participation insert"
ON public.quiz_participations
FOR INSERT
WITH CHECK (false);

-- -------------------------------------------------
-- C) secret_access: add secure RPC path first (SAFE migration)
-- -------------------------------------------------
ALTER TABLE public.secret_access ENABLE ROW LEVEL SECURITY;

-- 1) Create/upgrade a SECURITY DEFINER verification function that returns NO PII
--    It only says if token is valid + returns minimal safe metadata.
CREATE OR REPLACE FUNCTION public.verify_secret_access_safe(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row record;
BEGIN
  IF p_token IS NULL OR length(p_token) < 10 OR length(p_token) > 80 THEN
    RETURN jsonb_build_object('valid', false);
  END IF;

  SELECT access_token, secret_code, expires_at
  INTO v_row
  FROM public.secret_access
  WHERE access_token = p_token
    AND expires_at > now()
  LIMIT 1;

  IF v_row.access_token IS NULL THEN
    RETURN jsonb_build_object('valid', false);
  END IF;

  -- No email/phone/first_name returned (GDPR)
  RETURN jsonb_build_object(
    'valid', true,
    'secret_code', v_row.secret_code,
    'expires_at', v_row.expires_at
  );
END;
$$;

-- Lock down who can EXECUTE this function (recommended)
-- Supabase roles typically: anon, authenticated
REVOKE ALL ON FUNCTION public.verify_secret_access_safe(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.verify_secret_access_safe(text) TO anon, authenticated;

-- 2) OPTIONAL: create a secure grant function for anonymous flow (no PII stored)
--    If you keep storing email/phone for anonymous, that’s GDPR sensitive.
--    This creates an "anonymous" access entry WITHOUT email/phone, but requires a table change.
--    => Not applied automatically here to avoid schema break.

-- 3) Prepare policies for lockdown (DO NOT enable by default here)
--    Because your current front does direct SELECT/INSERT on secret_access.
--    We'll add them as commented steps to apply AFTER frontend migration.

-- -- AFTER FRONTEND MIGRATION:
-- -- DROP POLICY IF EXISTS "Anyone can verify access by token" ON public.secret_access;
-- -- DROP POLICY IF EXISTS "Anyone can request secret access" ON public.secret_access;
-- -- CREATE POLICY "No direct reads (use RPC)" ON public.secret_access FOR SELECT USING (false);
-- -- CREATE POLICY "No direct inserts (use RPC/edge)" ON public.secret_access FOR INSERT WITH CHECK (false);

-- -------------------------------------------------
-- D) secret_menu: keep read public, block modifications (safe)
-- -------------------------------------------------
ALTER TABLE public.secret_menu ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE p TEXT;
BEGIN
  FOREACH p IN ARRAY ARRAY[
    'No direct menu modifications',
    'No direct menu updates',
    'No direct menu deletes'
  ]
  LOOP
    IF EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname='public' AND tablename='secret_menu'
        AND policyname=p
    ) THEN
      EXECUTE format('DROP POLICY %I ON public.secret_menu', p);
    END IF;
  END LOOP;
END $$;

CREATE POLICY "No direct menu modifications"
ON public.secret_menu
FOR INSERT
WITH CHECK (false);

CREATE POLICY "No direct menu updates"
ON public.secret_menu
FOR UPDATE
USING (false);

CREATE POLICY "No direct menu deletes"
ON public.secret_menu
FOR DELETE
USING (false);

-- -------------------------------------------------
-- E) ensure_secret_menu: KEEP SECURITY DEFINER but restrict EXECUTE instead
--    Switching to INVOKER can break existing calls; restricting EXECUTE is safer.
-- -------------------------------------------------
-- If your current ensure_secret_menu exists as DEFINER, we keep it and restrict who can call it.
-- (Do not overwrite your function body here; only lock EXECUTE.)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname='public' AND p.proname='ensure_secret_menu'
  ) THEN
    REVOKE ALL ON FUNCTION public.ensure_secret_menu() FROM PUBLIC;
    -- Only allow server-side/service usage. If you need client access, you can grant to authenticated.
    -- GRANT EXECUTE ON FUNCTION public.ensure_secret_menu() TO authenticated;
  END IF;
END $$;
