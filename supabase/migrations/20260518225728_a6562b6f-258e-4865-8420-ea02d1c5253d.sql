
-- 1. Storage: drop duplicate {public} write policies on secret-menu-media
DROP POLICY IF EXISTS "Admin can upload secret menu media" ON storage.objects;
DROP POLICY IF EXISTS "Admin can update secret menu media" ON storage.objects;
DROP POLICY IF EXISTS "Admin can delete secret menu media" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view secret menu media" ON storage.objects;
-- Keep only "Public can view secret menu media" + the 3 admin-scoped policies

-- 2. Profiles: prevent privilege escalation via self-update of sensitive columns
CREATE OR REPLACE FUNCTION public.prevent_profile_privilege_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF current_setting('role', true) = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF NEW.secret_menu_unlocked IS DISTINCT FROM OLD.secret_menu_unlocked
     OR NEW.secret_menu_unlocked_at IS DISTINCT FROM OLD.secret_menu_unlocked_at
     OR NEW.secret_menu_code IS DISTINCT FROM OLD.secret_menu_code
     OR NEW.loyalty_points IS DISTINCT FROM OLD.loyalty_points
     OR NEW.total_visits IS DISTINCT FROM OLD.total_visits THEN
    RAISE EXCEPTION 'Modification of protected profile fields is not allowed';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_profile_privilege_escalation ON public.profiles;
CREATE TRIGGER trg_prevent_profile_privilege_escalation
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.prevent_profile_privilege_escalation();

-- 3. Reservations: require user_id to be set
DROP POLICY IF EXISTS "Users can create reservations" ON public.reservations;
CREATE POLICY "Users can create reservations"
  ON public.reservations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND user_id IS NOT NULL);

-- 4. quiz_winners_public: switch to security_invoker
ALTER VIEW public.quiz_winners_public SET (security_invoker = true);
