
CREATE OR REPLACE FUNCTION public.has_liked_post(p_post_id uuid, p_fingerprint text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.post_interactions
    WHERE post_id = p_post_id
      AND interaction_type = 'like'
      AND device_fingerprint = p_fingerprint
  );
$$;

REVOKE EXECUTE ON FUNCTION public.has_liked_post(uuid, text) FROM public;
GRANT EXECUTE ON FUNCTION public.has_liked_post(uuid, text) TO anon, authenticated;
