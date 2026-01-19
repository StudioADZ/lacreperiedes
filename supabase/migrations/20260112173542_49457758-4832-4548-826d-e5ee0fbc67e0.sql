-- =====================================================
-- SAFE PATCH: lock down social_posts + quiz_participations
-- =====================================================

-- -------------------------
-- 1) social_posts
-- -------------------------
ALTER TABLE public.social_posts ENABLE ROW LEVEL SECURITY;

-- Drop the permissive policy if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public'
      AND tablename='social_posts'
      AND policyname='Allow all operations for now'
  ) THEN
    DROP POLICY "Allow all operations for now" ON public.social_posts;
  END IF;
END $$;

-- Ensure public can read visible posts (create if missing)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public'
      AND tablename='social_posts'
      AND policyname='Anyone can view visible social posts'
  ) THEN
    CREATE POLICY "Anyone can view visible social posts"
    ON public.social_posts
    FOR SELECT
    USING (is_visible = true);
  END IF;
END $$;

-- IMPORTANT:
-- No INSERT/UPDATE/DELETE policies => client cannot write.
-- Edge Functions with service role can still manage posts.


-- -------------------------
-- 2) quiz_participations
-- -------------------------
ALTER TABLE public.quiz_participations ENABLE ROW LEVEL SECURITY;

-- Drop common permissive policies if they exist (safe cleanup)
DO $$
DECLARE
  p TEXT;
BEGIN
  FOREACH p IN ARRAY ARRAY[
    'Anyone can read participations',
    'Allow read access',
    'Public can read participations',
    'Everyone can read quiz participations',
    'Anyone can read participation by code',
    'Public can verify prize by code',
    'Verify by prize code only'
  ]
  LOOP
    IF EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname='public'
        AND tablename='quiz_participations'
        AND policyname=p
    ) THEN
      EXECUTE format('DROP POLICY %I ON public.quiz_participations', p);
    END IF;
  END LOOP;
END $$;

-- Create a hard block for public SELECT
-- (Edge functions using service_role still bypass RLS)
CREATE POLICY "No public select on quiz participations"
ON public.quiz_participations
FOR SELECT
USING (false);

-- Keep INSERT policy if your quiz submit goes via Edge Function only:
-- You can remove/avoid INSERT policies entirely and handle all writes in Edge Functions.
-- If you *do* insert from client (not recommended), you need a controlled INSERT policy here.
