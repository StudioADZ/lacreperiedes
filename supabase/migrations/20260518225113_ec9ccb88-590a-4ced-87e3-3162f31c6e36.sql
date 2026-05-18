
-- 1. Secret menu media bucket: admin-only writes
DROP POLICY IF EXISTS "Public can upload secret menu media" ON storage.objects;
DROP POLICY IF EXISTS "Public can update secret menu media" ON storage.objects;
DROP POLICY IF EXISTS "Public can delete secret menu media" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload secret menu media" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update secret menu media" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete secret menu media" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload secret menu media" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update secret menu media" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete secret menu media" ON storage.objects;
DROP POLICY IF EXISTS "Public can view secret menu media" ON storage.objects;

CREATE POLICY "Public can view secret menu media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'secret-menu-media');

CREATE POLICY "Admins can upload secret menu media"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'secret-menu-media' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update secret menu media"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'secret-menu-media' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'secret-menu-media' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete secret menu media"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'secret-menu-media' AND public.has_role(auth.uid(), 'admin'));

-- 2. user_roles: explicit admin-only INSERT/UPDATE/DELETE
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert roles"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update roles"
  ON public.user_roles FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
  ON public.user_roles FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 3. post_interactions: hide device_fingerprint from public reads
DROP POLICY IF EXISTS "Anyone can view interactions" ON public.post_interactions;

CREATE POLICY "Admins can view all interactions"
  ON public.post_interactions FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE VIEW public.post_interactions_public
WITH (security_invoker = true) AS
SELECT
  id,
  post_id,
  interaction_type,
  comment_text,
  created_at
FROM public.post_interactions;

GRANT SELECT ON public.post_interactions_public TO anon, authenticated;
