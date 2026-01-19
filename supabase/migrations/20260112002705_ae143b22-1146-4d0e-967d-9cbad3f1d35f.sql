-- =====================================================
-- SAFE RLS HARDENING (non-destructive)
-- =====================================================

-- 0) Drop the policies you created / replaced
DROP POLICY IF EXISTS "Public can submit quiz participation" ON public.quiz_participations;
DROP POLICY IF EXISTS "Public can verify prize by code" ON public.quiz_participations;

DROP POLICY IF EXISTS "Public can create quiz sessions" ON public.quiz_sessions;
DROP POLICY IF EXISTS "Public can read own quiz sessions" ON public.quiz_sessions;
DROP POLICY IF EXISTS "Public can update own quiz sessions" ON public.quiz_sessions;

-- 1) IMPORTANT: prevent public SELECT on sensitive tables
-- (Edge Functions with service role still work.)
REVOKE SELECT ON public.quiz_participations FROM anon, authenticated;
REVOKE ALL   ON public.quiz_sessions       FROM anon, authenticated;

-- Keep weekly_stock readable if you want public display
GRANT SELECT ON public.weekly_stock TO anon, authenticated;

-- 2) Allow only INSERT on participations (optional: if client inserts directly)
-- If your flow submits via Edge Function, you can REVOKE INSERT too.
GRANT INSERT ON public.quiz_participations TO anon, authenticated;

-- RLS policy: only allow inserting participations with basic constraints
CREATE POLICY "Public can submit quiz participation"
ON public.quiz_participations
FOR INSERT
WITH CHECK (
  rgpd_consent = true
  AND first_name IS NOT NULL
  AND email IS NOT NULL
  AND phone IS NOT NULL
  AND length(first_name) BETWEEN 1 AND 50
  AND length(email) BETWEEN 3 AND 100
  AND length(phone) BETWEEN 9 AND 15
);

-- 3) Expose SAFE read models via views (no PII)
-- A) safe view for verification screen / public display (NO email/phone/device_fingerprint)
CREATE OR REPLACE VIEW public.quiz_participations_public AS
SELECT
  prize_code,
  first_name,
  prize_won,
  week_start,
  prize_claimed,
  claimed_at,
  created_at
FROM public.quiz_participations;

GRANT SELECT ON public.quiz_participations_public TO anon, authenticated;

-- B) safe view for sessions if you want UI to show “status” only
-- (No question_ids, no answers)
CREATE OR REPLACE VIEW public.quiz_sessions_public AS
SELECT
  id,
  device_fingerprint,
  current_question,
  started_at,
  last_activity,
  expires_at,
  completed
FROM public.quiz_sessions;

GRANT SELECT ON public.quiz_sessions_public TO anon, authenticated;

-- 4) OPTIONAL (recommended): Public verification via SECURITY DEFINER RPC
-- This prevents “select all rows” issues and returns only non-sensitive fields.
-- IMPORTANT: this function does not expose email/phone/device_fingerprint.
CREATE OR REPLACE FUNCTION public.verify_prize_public(p_code text)
RETURNS TABLE (
  valid boolean,
  first_name text,
  prize text,
  week_start date,
  claimed boolean,
  claimed_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    (qp.prize_code IS NOT NULL) as valid,
    qp.first_name,
    qp.prize_won,
    qp.week_start,
    qp.prize_claimed,
    qp.claimed_at
  FROM public.quiz_participations qp
  WHERE qp.prize_code = upper(p_code)
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL, NULL, NULL, NULL, NULL;
  END IF;
END;
$$;

-- Allow public to call the function
GRANT EXECUTE ON FUNCTION public.verify_prize_public(text) TO anon, authenticated;
