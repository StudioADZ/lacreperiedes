-- =============================================
-- SAFE PATCH: quiz_participations + secret-menu-media bucket
-- =============================================

-- -----------------------------
-- 1) quiz_participations columns
-- -----------------------------
ALTER TABLE public.quiz_participations 
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending';

ALTER TABLE public.quiz_participations 
  ADD COLUMN IF NOT EXISTS security_token TEXT,
  ADD COLUMN IF NOT EXISTS token_generated_at TIMESTAMP WITH TIME ZONE;

-- Indexes (safe)
CREATE INDEX IF NOT EXISTS idx_quiz_participations_status
  ON public.quiz_participations(status);

CREATE INDEX IF NOT EXISTS idx_quiz_participations_prize_code
  ON public.quiz_participations(prize_code);


-- -----------------------------
-- 2) Storage bucket
-- -----------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('secret-menu-media', 'secret-menu-media', true)
ON CONFLICT (id) DO NOTHING;

-- Ensure RLS is on (safe even if already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- -----------------------------
-- 3) Storage policies (SAFE + idempotent)
-- -----------------------------
DO $$
BEGIN
  -- Drop existing policies by name to avoid "already exists" errors
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='storage' AND tablename='objects'
      AND policyname='Anyone can view secret menu media'
  ) THEN
    DROP POLICY "Anyone can view secret menu media" ON storage.objects;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='storage' AND tablename='objects'
      AND policyname='Admin can upload secret menu media'
  ) THEN
    DROP POLICY "Admin can upload secret menu media" ON storage.objects;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='storage' AND tablename='objects'
      AND policyname='Admin can update secret menu media'
  ) THEN
    DROP POLICY "Admin can update secret menu media" ON storage.objects;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='storage' AND tablename='objects'
      AND policyname='Admin can delete secret menu media'
  ) THEN
    DROP POLICY "Admin can delete secret menu media" ON storage.objects;
  END IF;
END $$;

-- PUBLIC READ (ok for public bucket)
CREATE POLICY "Anyone can view secret menu media" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'secret-menu-media');

-- ✅ ADMIN-ONLY WRITE (requires your public.user_roles table)
-- If you DON'T want any direct writes (Edge Functions only),
-- see "Option B" below.

CREATE POLICY "Admin can upload secret menu media" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'secret-menu-media'
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = 'admin'
  )
);

CREATE POLICY "Admin can update secret menu media" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'secret-menu-media'
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = 'admin'
  )
);

CREATE POLICY "Admin can delete secret menu media" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'secret-menu-media'
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = 'admin'
  )
);

-- -----------------------------
-- Option B (alternative stricte) : bloque toute écriture directe
-- (à utiliser si tu veux "Edge Functions only")
-- -----------------------------
-- CREATE POLICY "Block direct secret media inserts"
-- ON storage.objects FOR INSERT WITH CHECK (false);
-- CREATE POLICY "Block direct secret media updates"
-- ON storage.objects FOR UPDATE USING (false);
-- CREATE POLICY "Block direct secret media deletes"
-- ON storage.objects FOR DELETE USING (false);
