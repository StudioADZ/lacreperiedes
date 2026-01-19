-- =====================================================
-- SAFE PATCH: social_posts (non-destructive & secure)
-- هدف: public can read visible posts only
-- admin writes should go through service role (edge function)
-- =====================================================

-- 1) Create table safely (won't fail if it already exists)
CREATE TABLE IF NOT EXISTS public.social_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  url TEXT NOT NULL,
  network TEXT NOT NULL CHECK (network IN ('instagram', 'facebook')),
  is_visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2) Ensure RLS enabled
ALTER TABLE public.social_posts ENABLE ROW LEVEL SECURITY;

-- 3) Ensure public read policy exists (visible only)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'social_posts'
      AND policyname = 'public_read_visible_social_posts'
  ) THEN
    CREATE POLICY public_read_visible_social_posts
    ON public.social_posts
    FOR SELECT
    USING (is_visible = true);
  END IF;
END $$;

-- 4) Remove the dangerous "allow all" policy if present
-- (Targeted removal: prevents public write access)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'social_posts'
      AND policyname = 'Allow all operations for now'
  ) THEN
    DROP POLICY "Allow all operations for now" ON public.social_posts;
  END IF;
END $$;
