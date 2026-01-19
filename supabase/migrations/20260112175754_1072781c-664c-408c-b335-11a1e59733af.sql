-- =============================================
-- SAFE PATCH: Lock down social_posts writes
-- =============================================

ALTER TABLE public.social_posts ENABLE ROW LEVEL SECURITY;

-- 1) Remove known-permissive write policies if they exist
DO $$
BEGIN
  -- If you previously had an overly permissive policy:
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public'
      AND tablename='social_posts'
      AND policyname='Allow all operations for now'
  ) THEN
    DROP POLICY "Allow all operations for now" ON public.social_posts;
  END IF;

  -- Drop our "block" policies if they already exist (avoid CREATE POLICY failure)
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public'
      AND tablename='social_posts'
      AND policyname='Block direct inserts'
  ) THEN
    DROP POLICY "Block direct inserts" ON public.social_posts;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public'
      AND tablename='social_posts'
      AND policyname='Block direct updates'
  ) THEN
    DROP POLICY "Block direct updates" ON public.social_posts;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public'
      AND tablename='social_posts'
      AND policyname='Block direct deletes'
  ) THEN
    DROP POLICY "Block direct deletes" ON public.social_posts;
  END IF;
END $$;

-- 2) Block direct client writes (Edge Functions using service-role bypass RLS)
CREATE POLICY "Block direct inserts"
ON public.social_posts
FOR INSERT
WITH CHECK (false);

CREATE POLICY "Block direct updates"
ON public.social_posts
FOR UPDATE
USING (false);

CREATE POLICY "Block direct deletes"
ON public.social_posts
FOR DELETE
USING (false);

-- 3) (Optional) Ensure public can read only visible posts
-- Keep this commented if you already manage it elsewhere.
-- If you uncomment, make sure you don't accidentally duplicate a policy name.
-- DO $$
-- BEGIN
--   IF NOT EXISTS (
--     SELECT 1 FROM pg_policies
--     WHERE schemaname='public'
--       AND tablename='social_posts'
--       AND policyname='Anyone can view visible social posts'
--   ) THEN
--     CREATE POLICY "Anyone can view visible social posts"
--     ON public.social_posts
--     FOR SELECT
--     USING (is_visible = true);
--   END IF;
-- END $$;
