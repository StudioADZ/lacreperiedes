-- =============================================
-- SAFE PATCH: post_interactions INSERT policy
-- =============================================

ALTER TABLE public.post_interactions ENABLE ROW LEVEL SECURITY;

-- Drop old policy safely (no error if missing)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public'
      AND tablename='post_interactions'
      AND policyname='Anyone can add interactions'
  ) THEN
    DROP POLICY "Anyone can add interactions" ON public.post_interactions;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public'
      AND tablename='post_interactions'
      AND policyname='Add interactions with fingerprint'
  ) THEN
    DROP POLICY "Add interactions with fingerprint" ON public.post_interactions;
  END IF;
END $$;

-- New INSERT policy
CREATE POLICY "Add interactions with fingerprint"
ON public.post_interactions
FOR INSERT
WITH CHECK (
  -- required fields
  post_id IS NOT NULL
  AND device_fingerprint IS NOT NULL
  AND btrim(device_fingerprint) <> ''
  AND length(device_fingerprint) BETWEEN 5 AND 50

  -- comment rules (optional but recommended)
  AND (
    interaction_type <> 'comment'
    OR (
      comment_text IS NOT NULL
      AND btrim(comment_text) <> ''
      AND length(comment_text) <= 500
    )
  )
);

-- OPTIONAL (recommended): prevent multiple likes from same device on same post
-- Only do this if you want "1 device = 1 like"
-- (Won't affect comments)
-- CREATE UNIQUE INDEX IF NOT EXISTS uq_like_per_device
-- ON public.post_interactions(post_id, device_fingerprint, interaction_type)
-- WHERE interaction_type = 'like';
