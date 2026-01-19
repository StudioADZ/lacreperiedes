-- ============================================
-- PHASE 1: SÉCURITÉ - Masquer correct_answer
-- ============================================

-- Vue publique sans correct_answer
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

-- Politique RLS pour la vue
GRANT SELECT ON public.quiz_questions_public TO anon, authenticated;

-- Supprimer l'ancienne politique qui expose correct_answer
DROP POLICY IF EXISTS "Public can read active questions" ON public.quiz_questions;

-- Nouvelle politique: Seul le service role peut lire quiz_questions
CREATE POLICY "Only service role can read questions"
ON public.quiz_questions
FOR SELECT
TO service_role
USING (true);

-- ============================================
-- PHASE 1: SÉCURITÉ - Protéger secret_code
-- ============================================

-- Supprimer l'ancienne politique
DROP POLICY IF EXISTS "Anyone can read active secret menus" ON public.secret_menu;

-- Vue publique sans secret_code
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

-- Accorder l'accès à la vue publique
GRANT SELECT ON public.secret_menu_public TO anon, authenticated;

-- ============================================
-- PHASE 2: ESPACE CLIENT - Tables
-- ============================================

-- Enum pour les rôles
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
  END IF;
END $$;

-- Table des rôles utilisateurs
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Fonction pour vérifier les rôles (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
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
  )
$$;

-- Table des profils clients
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  city TEXT,
  avatar_url TEXT,
  -- Points fidélité
  loyalty_points INTEGER DEFAULT 0,
  total_visits INTEGER DEFAULT 0,
  -- Coffre-fort carte secrète
  secret_menu_unlocked BOOLEAN DEFAULT false,
  secret_menu_code TEXT,
  secret_menu_unlocked_at TIMESTAMP WITH TIME ZONE,
  -- Métadonnées
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour profiles
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Trigger pour créer le profil automatiquement à l'inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, first_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'first_name', NEW.raw_user_meta_data->>'name', 'Nouveau client'));
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Table des réservations client
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

CREATE POLICY "Users can view own reservations"
ON public.reservations
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create reservations"
ON public.reservations
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Table historique des gains
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

CREATE POLICY "Users can view own prizes"
ON public.prize_history
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- ============================================
-- PHASE 2: Fonction unlock secret menu
-- ============================================

CREATE OR REPLACE FUNCTION public.unlock_secret_menu_for_user(p_user_id UUID, p_secret_code TEXT)
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

-- ============================================
-- PHASE 2: Fonction ajouter points fidélité
-- ============================================

CREATE OR REPLACE FUNCTION public.add_loyalty_points(p_user_id UUID, p_points INTEGER)
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
    loyalty_points = loyalty_points + p_points,
    total_visits = total_visits + 1,
    updated_at = now()
  WHERE user_id = p_user_id
  RETURNING loyalty_points INTO new_points;
  
  RETURN COALESCE(new_points, 0);
END;
$$;

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();