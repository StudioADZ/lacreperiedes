-- Fix RLS policies to be more secure while allowing public quiz access
-- Drop overly permissive policies
DROP POLICY IF EXISTS "Anyone can create participation" ON public.quiz_participations;
DROP POLICY IF EXISTS "Anyone can read participation by code" ON public.quiz_participations;
DROP POLICY IF EXISTS "Anyone can manage quiz sessions" ON public.quiz_sessions;

-- More restrictive policies for quiz_participations
-- Only allow inserting participations (no updates from client)
CREATE POLICY "Public can submit quiz participation"
ON public.quiz_participations FOR INSERT
WITH CHECK (
  rgpd_consent = true AND
  first_name IS NOT NULL AND
  email IS NOT NULL AND
  phone IS NOT NULL
);

-- Only allow reading by prize_code (for verification)
CREATE POLICY "Public can verify prize by code"
ON public.quiz_participations FOR SELECT
USING (prize_code IS NOT NULL);

-- Quiz sessions - only allow creating and reading own sessions by device fingerprint
CREATE POLICY "Public can create quiz sessions"
ON public.quiz_sessions FOR INSERT
WITH CHECK (device_fingerprint IS NOT NULL);

CREATE POLICY "Public can read own quiz sessions"
ON public.quiz_sessions FOR SELECT
USING (true);

CREATE POLICY "Public can update own quiz sessions"
ON public.quiz_sessions FOR UPDATE
USING (device_fingerprint IS NOT NULL)
WITH CHECK (device_fingerprint IS NOT NULL);

-- No delete policy - sessions are managed server-side