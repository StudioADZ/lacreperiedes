-- =====================================================
-- SAFE PATCH: post_interactions (non-destructive & safer)
-- =====================================================

-- 1) Create table safely
CREATE TABLE IF NOT EXISTS public.post_interactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES public.social_posts(id) ON DELETE CASCADE,
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('like', 'comment')),
  device_fingerprint TEXT NOT NULL,
  comment_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  -- Ensure comments are meaningful + bounded
  CONSTRAINT post_interactions_comment_rules CHECK (
    (interaction_type = 'like' AND (comment_text IS NULL OR btrim(comment_text) = ''))
    OR
    (interaction_type = 'comment' AND comment_text IS NOT NULL AND length(btrim(comment_text)) BETWEEN 1 AND 500)
  )
);

-- 2) Enable RLS (idempotent)
ALTER TABLE public.post_interactions ENABLE ROW LEVEL SECURITY;

-- 3) Indexes (idempotent)
CREATE INDEX IF NOT EXISTS idx_post_interactions_post_id
  ON public.post_interactions(post_id);

CREATE INDEX IF NOT EXISTS idx_post_interactions_device_post
  ON public.post_interactions(device_fingerprint, post_id);

-- 4) Enforce: one like per device per post (prevents spam likes)
-- Partial unique index: only for likes
CREATE UNIQUE INDEX IF NOT EXISTS ux_post_interactions_like_once
  ON public.post_interactions(post_id, device_fingerprint)
  WHERE (interaction_type = 'like');

-- 5) Create a SAFE public view (no device_fingerprint exposed)
CREATE OR REPLACE VIEW public.post_interactions_public AS
SELECT
  id,
  post_id,
  interaction_type,
  comment_text,
  created_at
FROM public.post_interactions;

-- 6) Policies: remove overly permissive ones if they exist
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='post_interactions'
      AND policyname='Anyone can view interactions'
  ) THEN
    DROP POLICY "Anyone can view interactions" ON public.post_interactions;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='post_interactions'
      AND policyname='Anyone can add interactions'
  ) THEN
    DROP POLICY "Anyone can add interactions" ON public.post_interactions;
  END IF;
END $$;

-- 7) Public SELECT only through the view (not the raw table)
-- Note: RLS doesn't apply to views the same way; we keep table locked down and expose via view privileges.
REVOKE ALL ON public.post_interactions FROM anon, authenticated;
GRANT SELECT ON public.post_interactions_public TO anon, authenticated;

-- 8) Public INSERT: allow inserting into table with meaningful checks
-- (If you prefer edge function only, remove this INSERT policy and keep inserts server-side.)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='post_interactions'
      AND policyname='public_can_insert_post_interactions'
  ) THEN
    CREATE POLICY public_can_insert_post_interactions
      ON public.post_interactions
      FOR INSERT
      WITH CHECK (
        post_id IS NOT NULL
        AND device_fingerprint IS NOT NULL
        AND length(device_fingerprint) BETWEEN 5 AND 50
        AND interaction_type IN ('like','comment')
      );
  END IF;
END $$;
