-- =====================================================
-- SAFE PATCH: secret_menu + secret_access (non-destructive)
-- =====================================================

-- 1) Extend secret_menu safely
ALTER TABLE public.secret_menu 
  ADD COLUMN IF NOT EXISTS valid_from TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS valid_to   TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS galette_items JSONB,
  ADD COLUMN IF NOT EXISTS crepe_items   JSONB;

-- Set defaults only when column is NULL (avoid overriding existing data)
UPDATE public.secret_menu
SET
  valid_from = COALESCE(valid_from, now()),
  valid_to   = COALESCE(valid_to, now() + interval '7 days'),
  galette_items = COALESCE(galette_items, '[]'::jsonb),
  crepe_items   = COALESCE(crepe_items, '[]'::jsonb)
WHERE
  valid_from IS NULL
  OR valid_to IS NULL
  OR galette_items IS NULL
  OR crepe_items IS NULL;

-- Optional: enforce defaults for future inserts (safe)
ALTER TABLE public.secret_menu
  ALTER COLUMN valid_from SET DEFAULT now(),
  ALTER COLUMN valid_to   SET DEFAULT (now() + interval '7 days'),
  ALTER COLUMN galette_items SET DEFAULT '[]'::jsonb,
  ALTER COLUMN crepe_items   SET DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS idx_secret_menu_validity
  ON public.secret_menu(valid_from, valid_to);


-- 2) secret_access table (safe)
CREATE TABLE IF NOT EXISTS public.secret_access (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  first_name TEXT NOT NULL,
  access_token TEXT NOT NULL UNIQUE,
  secret_code TEXT NOT NULL,

  -- Keep original week_start for backward compat if you already deployed TEXT elsewhere
  week_start TEXT NOT NULL,

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days')
);

-- Non-destructive improvement: add DATE column for coherent joins (if you want)
ALTER TABLE public.secret_access
  ADD COLUMN IF NOT EXISTS week_start_date DATE;

-- Backfill week_start_date if possible (best effort)
-- (Works if week_start is ISO date like '2025-01-19'. If not, it will fail; you can comment this out.)
DO $$
BEGIN
  BEGIN
    UPDATE public.secret_access
    SET week_start_date = COALESCE(week_start_date, week_start::date)
    WHERE week_start_date IS NULL;
  EXCEPTION WHEN others THEN
    -- ignore if conversion fails
    NULL;
  END;
END $$;

-- Helpful indexes (safe)
CREATE INDEX IF NOT EXISTS idx_secret_access_token
  ON public.secret_access(access_token);

CREATE INDEX IF NOT EXISTS idx_secret_access_email_week
  ON public.secret_access(email, week_start);

CREATE INDEX IF NOT EXISTS idx_secret_access_week_date
  ON public.secret_access(week_start_date);

-- Strongly recommended: uniqueness to prevent duplicates (non-destructive if no conflicts)
-- If duplicates already exist in prod, this will fail; in that case, fix duplicates first.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname='public' AND indexname='ux_secret_access_email_week'
  ) THEN
    CREATE UNIQUE INDEX ux_secret_access_email_week
      ON public.secret_access (email, week_start);
  END IF;
END $$;

-- Simple consistency check (safe)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_secret_access_expires_after_created'
  ) THEN
    ALTER TABLE public.secret_access
      ADD CONSTRAINT chk_secret_access_expires_after_created
      CHECK (expires_at > created_at);
  END IF;
END $$;

-- 3) RLS + policies (SAFE + secure)
ALTER TABLE public.secret_access ENABLE ROW LEVEL SECURITY;

-- Drop risky policies if they exist (idempotent)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='secret_access'
      AND policyname='Anyone can request secret access'
  ) THEN
    DROP POLICY "Anyone can request secret access" ON public.secret_access;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='secret_access'
      AND policyname='Anyone can verify access by token'
  ) THEN
    DROP POLICY "Anyone can verify access by token" ON public.secret_access;
  END IF;
END $$;

-- Keep INSERT public if you really insert directly from client.
-- (If inserts are only done by Edge Function / service role, you can remove this too.)
CREATE POLICY "Public can request secret access (insert only)"
ON public.secret_access
FOR INSERT
WITH CHECK (
  email IS NOT NULL
  AND phone IS NOT NULL
  AND first_name IS NOT NULL
  AND access_token IS NOT NULL
);

-- IMPORTANT: No public SELECT policy to avoid leaking PII.
-- Verification should be done via RPC verify_secret_access() or via Edge Function.


-- 4) Functions (SAFE + better atomicity)

CREATE OR REPLACE FUNCTION public.generate_access_token()
RETURNS TEXT AS $$
BEGIN
  RETURN encode(gen_random_bytes(16), 'hex'); -- 32 hex chars
END;
$$ LANGUAGE plpgsql SET search_path = public;


-- Grant access atomically (upsert style)
CREATE OR REPLACE FUNCTION public.grant_secret_access(
  p_email TEXT,
  p_phone TEXT,
  p_first_name TEXT,
  p_secret_code TEXT,
  p_week_start TEXT
)
RETURNS TEXT AS $$
DECLARE
  v_token TEXT;
  v_email TEXT;
  v_phone TEXT;
  v_name  TEXT;
  v_code  TEXT;
BEGIN
  v_email := lower(trim(p_email));
  v_phone := regexp_replace(p_phone, '[\s\.\-]', '', 'g');
  v_name  := trim(p_first_name);
  v_code  := upper(trim(p_secret_code));

  -- Generate token (may not be used if conflict returns existing row)
  v_token := public.generate_access_token();

  INSERT INTO public.secret_access (email, phone, first_name, access_token, secret_code, week_start)
  VALUES (v_email, v_phone, v_name, v_token, v_code, trim(p_week_start))
  ON CONFLICT (email, week_start)
  DO UPDATE SET
    -- Keep original token (don’t rotate silently)
    phone = EXCLUDED.phone,
    first_name = EXCLUDED.first_name,
    secret_code = EXCLUDED.secret_code
  RETURNING access_token INTO v_token;

  RETURN v_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Verify token without exposing table rows
CREATE OR REPLACE FUNCTION public.verify_secret_access(p_token TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.secret_access
    WHERE access_token = p_token
      AND expires_at > now()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Optional hardening: limit who can execute these RPCs
REVOKE EXECUTE ON FUNCTION public.grant_secret_access(TEXT,TEXT,TEXT,TEXT,TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.verify_secret_access(TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.generate_access_token() FROM PUBLIC;

-- Example (adapt roles to your setup):
-- GRANT EXECUTE ON FUNCTION public.verify_secret_access(TEXT) TO anon, authenticated;
-- GRANT EXECUTE ON FUNCTION public.grant_secret_access(TEXT,TEXT,TEXT,TEXT,TEXT) TO service_role;
