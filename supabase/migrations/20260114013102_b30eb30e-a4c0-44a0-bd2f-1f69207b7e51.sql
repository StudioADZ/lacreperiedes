-- ============================================
-- SAFE PATCH: Public views + Client space
-- Compatible with existing RPC signatures
-- ============================================

-- ----------------------------
-- PHASE 1: QUIZ - Hide correct_answer
-- ----------------------------

-- Ensure RLS is enabled (safe)
ALTER TABLE IF EXISTS public.quiz_questions ENABLE ROW LEVEL SECURITY;

-- Public view without correct_answer (safe replace)
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

-- Ensure anon/authenticated cannot SELECT base table directly (safe hardening)
REVOKE ALL ON TABLE public.quiz_questions FROM anon, authenticated;

-- Drop only the specific old policy name if it exists (won't touch other policies)
DROP POLICY IF EXISTS "Public can read active questions" ON public.quiz_questions;

-- Policy for service_role only (keep edge/service usage)
DROP POLICY IF EXISTS "Only service role can read questions" ON public.quiz_questions;
CREATE POLICY "Only service role can read questions"
ON public.quiz_questions
FOR SELECT
TO service_role
USING (true);


-- ----------------------------
-- PHASE 1: SECRET MENU - Hide secret_code
-- ----------------------------

ALTER TABLE IF EXISTS public.secret_menu ENABLE ROW LEVEL SECURITY;

-- Remove public read policy if it exists
DROP POLICY IF EXISTS "Anyone can read active secret menus" ON public.secret_menu;

-- Public view without secret_code
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

-- Prevent direct reads on base table (RGPD safety)
REVOKE ALL ON TABLE public.secret_menu FROM anon, authenticated;


-- ============================================
-- PHASE 2: CLIENT SPACE - roles, profiles, etc.
-- ============================================

-- Enum roles (safe)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
  END IF;
END $$;

-- user_roles
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- IMPORTANT: keep the SAME signature as existing types:
-- has_role(_role, _user_id)
CREATE OR REPLACE FUNCTION public.has_role(_role public.app_role, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
$$;

-- profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  city TEXT,
  avatar_url TEXT,
  loyalty_points INTEGER DEFAULT 0,
  total_visits INTEGER DEFAULT 0,
  secret_menu_unlocked BOOLEAN DEFAULT false,
  secret_menu_code TEXT,
  secret_menu_unlocked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies (create if not exists isn't supported for policies => drop by name only if you know names)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Trigger: create profile & default role at signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, first_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', NEW.raw_user_meta_data->>'name', 'Nouveau client')
  )
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- reservations
CREATE TABLE IF NOT EXISTS public.reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  reservation_date DATE NOT NULL,
  reservation_time TIME NOT NULL,
  party_size INTEGER DEFAULT 2,
  special_requests TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own reservations" ON public.reservations;
CREATE POLICY "Users can view own reservations"
ON public.reservations
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create reservations" ON public.reservations;
CREATE POLICY "Users can create reservations"
ON public.reservations
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- prize_history
CREATE TABLE IF NOT EXISTS public.prize_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  prize_type TEXT NOT NULL,
  prize_code TEXT,
  won_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  claimed_at TIMESTAMP WITH TIME ZONE,
  is_claimed BOOLEAN DEFAULT false,
  loyalty_points_earned INTEGER DEFAULT 0
);

ALTER TABLE public.prize_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own prizes" ON public.prize_history;
CREATE POLICY "Users can view own prizes"
ON public.prize_history
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Keep SAME signature as existing types:
-- unlock_secret_menu_for_user(p_secret_code, p_user_id)
CREATE OR REPLACE FUNCTION public.unlock_secret_menu_for_user(p_secret_code TEXT, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET 
    secret_menu_unlocked = true,
    secret_menu_code = p_secret_code,
    secret_menu_unlocked_at = now()
  WHERE user_id = p_user_id;

  RETURN FOUND;
END;
$$;

-- Keep SAME signature as existing types:
-- add_loyalty_points(p_points, p_user_id)
CREATE OR REPLACE FUNCTION public.add_loyalty_points(p_points INTEGER, p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_points INTEGER;
BEGIN
  UPDATE public.profiles
  SET 
    loyalty_points = COALESCE(loyalty_points, 0) + p_points,
    total_visits = COALESCE(total_visits, 0) + 1,
    updated_at = now()
  WHERE user_id = p_user_id
  RETURNING loyalty_points INTO new_points;

  RETURN COALESCE(new_points, 0);
END;
$$;

-- IMPORTANT: avoid replacing global update_updated_at_column if it already exists
-- Create a dedicated trigger function for profiles only (no side effects)
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

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_profiles_updated_at_column();
