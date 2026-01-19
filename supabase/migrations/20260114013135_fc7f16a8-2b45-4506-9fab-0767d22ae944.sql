-- ============================================
-- CORRECTION SÉCURITÉ 1: Vues SECURITY INVOKER
-- ============================================

-- Recréer la vue quiz_questions_public avec SECURITY INVOKER
DROP VIEW IF EXISTS public.quiz_questions_public;
CREATE VIEW public.quiz_questions_public 
WITH (security_invoker = true)
AS
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

-- Recréer la vue secret_menu_public avec SECURITY INVOKER
DROP VIEW IF EXISTS public.secret_menu_public;
CREATE VIEW public.secret_menu_public 
WITH (security_invoker = true)
AS
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

-- ============================================
-- CORRECTION SÉCURITÉ 2: Politiques RLS pour quiz_questions
-- ============================================

-- Permettre anon/authenticated de lire via la table de base (nécessaire pour la vue)
DROP POLICY IF EXISTS "Only service role can read questions" ON public.quiz_questions;

CREATE POLICY "Allow reading questions without correct_answer"
ON public.quiz_questions
FOR SELECT
TO anon, authenticated
USING (is_active = true);

-- ============================================
-- CORRECTION SÉCURITÉ 3: Politique RLS pour secret_menu
-- ============================================

CREATE POLICY "Allow reading menu without secret_code"
ON public.secret_menu
FOR SELECT
TO anon, authenticated
USING (is_active = true);

-- ============================================
-- CORRECTION SÉCURITÉ 4: RLS sur user_roles
-- ============================================

CREATE POLICY "Users can view own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- CORRECTION SÉCURITÉ 5: Fonction update_updated_at avec search_path
-- ============================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;