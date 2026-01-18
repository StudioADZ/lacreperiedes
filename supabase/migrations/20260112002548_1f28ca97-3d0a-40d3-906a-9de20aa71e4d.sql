-- =====================================================
-- SAFE HARDENING MIGRATION (non destructive)
-- Completes existing schema without rewriting it
-- =====================================================

-- 0) Make sure RLS is on (already in your script, kept for safety)
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_participations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_sessions ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 1) Prevent leaking correct answers
-- =====================================================

-- Revoke direct SELECT on quiz_questions from public roles
REVOKE SELECT ON public.quiz_questions FROM anon, authenticated;

-- Create a SAFE public view without correct_answer
CREATE OR REPLACE VIEW public.quiz_questions_public AS
SELECT
  id,
  question,
  option_a,
  option_b,
  option_c,
  option_d,
  category,
  is_active,
  created_at
FROM public.quiz_questions
WHERE is_active = true;

-- Grant select on the safe view
GRANT SELECT ON public.quiz_questions_public TO anon, authenticated;

-- (Optional) If you want PostgREST to expose the view nicely:
-- COMMENT ON VIEW public.quiz_questions_public IS 'Public-safe quiz questions (no correct answers).';


-- =====================================================
-- 2) Lock down quiz_sessions (anti-cheat / anti-sabotage)
-- =====================================================

-- In your current schema, sessions are public CRUD.
-- If your frontend relies on Edge Functions (service role) to manage sessions,
-- it's safe to block direct table access.

REVOKE ALL ON public.quiz_sessions FROM anon, authenticated;

-- If you *must* allow reading session status publicly, create a minimal view:
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

-- (No answers, no question_ids exposed)


-- =====================================================
-- 3) Protect PII in quiz_participations
-- =====================================================

-- Revoke direct SELECT to avoid leaking email/phone/device_fingerprint
REVOKE SELECT ON public.quiz_participations FROM anon, authenticated;

-- Create a safe public view for "verify by prize code" use-cases
CREATE OR REPLACE VIEW public.quiz_participations_public AS
SELECT
  prize_code,
  first_name,
  week_start,
  score,
  total_questions,
  prize_won,
  prize_claimed,
  claimed_at,
  created_at
FROM public.quiz_participations;

GRANT SELECT ON public.quiz_participations_public TO anon, authenticated;

-- Keep INSERT allowed if your client posts directly (but safer is Edge Function only).
-- If you want to keep direct inserts, keep your policy, but consider rate limiting in Edge Function.
-- If you want to force Edge Function only, revoke INSERT too:
-- REVOKE INSERT ON public.quiz_participations FROM anon, authenticated;


-- =====================================================
-- 4) Tighten overly broad RLS policies (optional but recommended)
-- =====================================================

-- Your existing policies are too permissive.
-- Because we've already REVOKED table privileges above,
-- these policies become less dangerous.
-- Still, it's cleaner to restrict them.

-- Quiz questions policy: keep (view already filters active)
-- No change needed on table since direct select revoked.

-- Weekly stock: public read is fine (no PII)
-- You may keep SELECT on table if you want:
-- (If you want to allow direct stock select:)
GRANT SELECT ON public.weekly_stock TO anon, authenticated;

-- Participations: keep INSERT policy if needed
-- Sessions: no need since we revoked ALL on table for public roles


-- =====================================================
-- 5) Week start consistency helpers (optional)
-- =====================================================

-- If your frontend uses Monday week-start, create a second function
-- to avoid breaking existing Sunday-based logic.
CREATE OR REPLACE FUNCTION public.get_current_week_start_monday()
RETURNS DATE AS $$
BEGIN
  -- Monday week start (Paris time)
  RETURN date_trunc('week', (now() AT TIME ZONE 'Europe/Paris')::timestamp)::date;
END;
$$ LANGUAGE plpgsql STABLE SET search_path = public;

-- Now you can explicitly choose:
-- - get_current_week_start() -> Sunday
-- - get_current_week_start_monday() -> Monday


-- =====================================================
-- 6) Prize code uniqueness helper (optional)
-- =====================================================

-- Your generate_prize_code can collide rarely.
-- This helper retries and returns a code not currently used.
CREATE OR REPLACE FUNCTION public.generate_unique_prize_code()
RETURNS TEXT AS $$
DECLARE
  new_code TEXT;
  tries INT := 0;
BEGIN
  LOOP
    tries := tries + 1;
    new_code := public.generate_prize_code();

    IF NOT EXISTS (
      SELECT 1 FROM public.quiz_participations WHERE prize_code = new_code
    ) THEN
      RETURN new_code;
    END IF;

    IF tries > 20 THEN
      RAISE EXCEPTION 'Could not generate unique prize code after % tries', tries;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SET search_path = public;
