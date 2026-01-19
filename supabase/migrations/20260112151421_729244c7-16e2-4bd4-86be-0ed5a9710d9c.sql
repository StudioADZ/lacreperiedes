-- =====================================================
-- SAFE PATCH: secret_menu (non-destructive, idempotent)
-- =====================================================

-- 0) updated_at trigger function (safe)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- 1) Table (safe)
CREATE TABLE IF NOT EXISTS public.secret_menu (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  week_start DATE NOT NULL,
  menu_name TEXT NOT NULL DEFAULT 'Menu Secret du Week-end',
  secret_code TEXT NOT NULL DEFAULT 'CREPE2025',
  galette_special TEXT,
  galette_special_description TEXT,
  crepe_special TEXT,
  crepe_special_description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(week_start)
);

-- 2) RLS
ALTER TABLE public.secret_menu ENABLE ROW LEVEL SECURITY;

-- 3) Policy (safe replace)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='secret_menu'
      AND policyname='Anyone can read active secret menus'
  ) THEN
    DROP POLICY "Anyone can read active secret menus" ON public.secret_menu;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='secret_menu'
      AND policyname='Public can read active secret menu'
  ) THEN
    CREATE POLICY "Public can read active secret menu"
    ON public.secret_menu
    FOR SELECT
    USING (is_active = true);
  END IF;
END $$;

-- 4) Optional but recommended: only one active menu at a time (non-destructive)
CREATE UNIQUE INDEX IF NOT EXISTS ux_secret_menu_single_active
  ON public.secret_menu ((is_active))
  WHERE (is_active = true);

-- 5) ensure_secret_menu (safe) : coherent week_start
CREATE OR REPLACE FUNCTION public.ensure_secret_menu()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_week_start DATE;
  v_menu_id UUID;
BEGIN
  -- Prefer system-wide week start if available (keeps everything consistent)
  IF EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname='public' AND p.proname='get_current_week_start'
  ) THEN
    SELECT public.get_current_week_start() INTO v_week_start;
  ELSE
    -- Fallback (ISO week start = Monday)
    SELECT (date_trunc('week', now() AT TIME ZONE 'Europe/Paris'))::date INTO v_week_start;
  END IF;

  SELECT id INTO v_menu_id
  FROM public.secret_menu
  WHERE week_start = v_week_start;

  IF v_menu_id IS NULL THEN
    INSERT INTO public.secret_menu (week_start)
    VALUES (v_week_start)
    RETURNING id INTO v_menu_id;
  END IF;

  RETURN v_menu_id;
END;
$$;

-- 6) Trigger updated_at (safe)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'update_secret_menu_updated_at'
  ) THEN
    CREATE TRIGGER update_secret_menu_updated_at
    BEFORE UPDATE ON public.secret_menu
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- 7) Optional security hardening (recommended)
-- Remove default PUBLIC execute and grant only if you have a role for it.
-- (If you don't manage roles, comment this out.)
REVOKE EXECUTE ON FUNCTION public.ensure_secret_menu() FROM PUBLIC;
 видно
-- Example: GRANT EXECUTE ON FUNCTION public.ensure_secret_menu() TO anon, authenticated;
