-- =====================================================
-- SAFE PATCH: Keep public views without leaking columns
-- =====================================================

-- ----------------------------
-- 1) PUBLIC VIEWS (DO NOT use security_invoker)
-- ----------------------------

-- Recreate views safely (no need to DROP VIEW; CREATE OR REPLACE is non-destructive)
CREATE OR REPLACE VIEW public.quiz_questions_public AS
SELECT 
  id,
  question,
  option_a,
  option_b,
  option_c,
  option_d,
  category,
  is_active,
  created_at
FROM public.quiz_questions
WHERE is_active = true;

GRANT SELECT ON public.quiz_questions_public TO anon, authenticated;

CREATE OR REPLACE VIEW public.secret_menu_public AS
SELECT 
  id,
  week_start,
  menu_name,
  galette_special,
  galette_special_description,
  crepe_special,
  crepe_special_description,
  galette_items,
  crepe_items,
  valid_from,
  valid_to,
  is_active,
  created_at,
  updated_at
FROM public.secret_menu
WHERE is_active = true;

GRANT SELECT ON public.secret_menu_public TO anon, authenticated;

-- Hardening: prevent direct table reads for anon/authenticated
REVOKE ALL ON TABLE public.quiz_questions FROM anon, authenticated;
REVOKE ALL ON TABLE public.secret_menu FROM anon, authenticated;

-- Ensure RLS on base tables (safe)
ALTER TABLE IF EXISTS public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.secret_menu ENABLE ROW LEVEL SECURITY;

-- Keep the base tables readable only by service_role (or postgres)
-- (Drop/recreate only the specific policy names we control)

DROP POLICY IF EXISTS "Only service role can read questions" ON public.quiz_questions;
CREATE POLICY "Only service role can read questions"
ON public.quiz_questions
FOR SELECT
TO service_role
USING (true);

-- If you already had "No direct menu modifications" policies, keep them.
-- Just ensure no public SELECT policy exists.
DROP POLICY IF EXISTS "Allow reading menu without secret_code" ON public.secret_menu;

-- Optional (recommended): service_role read for secret_menu table
DROP POLICY IF EXISTS "Only service role can read secret menu" ON public.secret_menu;
CREATE POLICY "Only service role can read secret menu"
ON public.secret_menu
FOR SELECT
TO service_role
USING (true);


-- ----------------------------
-- 2) user_roles RLS (SAFE + correct has_role signature)
-- ----------------------------

ALTER TABLE IF EXISTS public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
CREATE POLICY "Users can view own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
CREATE POLICY "Admins can manage roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role('admin', auth.uid()))
WITH CHECK (public.has_role('admin', auth.uid()));


-- ----------------------------
-- 3) updated_at trigger helper (avoid overwriting shared function)
-- ----------------------------

-- Create a dedicated function for profiles only, to avoid side effects
CREATE OR REPLACE FUNCTION public.update_profiles_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Attach to profiles (safe replace)
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_profiles_updated_at_column();
