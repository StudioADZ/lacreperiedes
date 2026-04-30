-- =====================================================
-- LA CRÊPERIE DES SAVEURS - QUIZ PREMIUM HARDENING
-- =====================================================
-- Why a new migration instead of editing the first one?
-- Supabase migrations may already be applied in production. Editing old migrations
-- is risky; this file safely upgrades the live database from the current state.

-- 1. Make public weekly stock reads safe while keeping stock creation reliable.
--    The frontend reads stock, but the function must be able to create the weekly row.
CREATE OR REPLACE FUNCTION public.get_current_week_start()
RETURNS DATE AS $$
BEGIN
  -- Most recent Sunday in Paris time.
  RETURN (date_trunc('week', (now() AT TIME ZONE 'Europe/Paris')::date + 1) - interval '1 day')::date;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.ensure_weekly_stock()
RETURNS public.weekly_stock AS $$
DECLARE
  current_week DATE;
  stock_record public.weekly_stock;
BEGIN
  current_week := public.get_current_week_start();

  SELECT * INTO stock_record
  FROM public.weekly_stock
  WHERE week_start = current_week;

  IF stock_record IS NULL THEN
    INSERT INTO public.weekly_stock (week_start)
    VALUES (current_week)
    RETURNING * INTO stock_record;
  END IF;

  RETURN stock_record;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Prize helpers: callable only from trusted server-side code.
CREATE OR REPLACE FUNCTION public.generate_prize_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.claim_prize(
  p_prize_type TEXT,
  p_week_start DATE
)
RETURNS BOOLEAN AS $$
DECLARE
  affected_rows INTEGER;
BEGIN
  IF p_week_start IS NULL THEN
    RETURN false;
  END IF;

  IF p_prize_type = 'formule_complete' THEN
    UPDATE public.weekly_stock
    SET formule_complete_remaining = formule_complete_remaining - 1
    WHERE week_start = p_week_start AND formule_complete_remaining > 0;
  ELSIF p_prize_type = 'galette' THEN
    UPDATE public.weekly_stock
    SET galette_remaining = galette_remaining - 1
    WHERE week_start = p_week_start AND galette_remaining > 0;
  ELSIF p_prize_type = 'crepe' THEN
    UPDATE public.weekly_stock
    SET crepe_remaining = crepe_remaining - 1
    WHERE week_start = p_week_start AND crepe_remaining > 0;
  ELSE
    RETURN false;
  END IF;

  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  RETURN affected_rows > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.generate_prize_code() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.claim_prize(TEXT, DATE) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.ensure_weekly_stock() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_current_week_start() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.get_current_week_start() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.ensure_weekly_stock() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.generate_prize_code() TO service_role;
GRANT EXECUTE ON FUNCTION public.claim_prize(TEXT, DATE) TO service_role;

-- 3. Lock down sensitive quiz data.
--    Public users must not read names, emails, phones or device fingerprints directly.
--    Edge functions use the service role and keep returning only safe fields.
DROP POLICY IF EXISTS "Anyone can create participation" ON public.quiz_participations;
DROP POLICY IF EXISTS "Anyone can read participation by code" ON public.quiz_participations;
DROP POLICY IF EXISTS "Anyone can manage quiz sessions" ON public.quiz_sessions;

-- Keep public read-only access for the data intentionally displayed on the site.
DROP POLICY IF EXISTS "Anyone can read active questions" ON public.quiz_questions;
CREATE POLICY "Anyone can read active questions"
ON public.quiz_questions FOR SELECT
USING (is_active = true);

DROP POLICY IF EXISTS "Anyone can read weekly stock" ON public.weekly_stock;
CREATE POLICY "Anyone can read weekly stock"
ON public.weekly_stock FOR SELECT
USING (true);

-- 4. Add safety checks for all future rows without blocking deployment if old data exists.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'quiz_questions_category_allowed') THEN
    ALTER TABLE public.quiz_questions
      ADD CONSTRAINT quiz_questions_category_allowed
      CHECK (category IN ('local', 'food')) NOT VALID;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'quiz_questions_text_not_blank') THEN
    ALTER TABLE public.quiz_questions
      ADD CONSTRAINT quiz_questions_text_not_blank
      CHECK (
        btrim(question) <> ''
        AND btrim(option_a) <> ''
        AND btrim(option_b) <> ''
        AND btrim(option_c) <> ''
        AND btrim(option_d) <> ''
      ) NOT VALID;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'weekly_stock_non_negative') THEN
    ALTER TABLE public.weekly_stock
      ADD CONSTRAINT weekly_stock_non_negative
      CHECK (
        formule_complete_total >= 0
        AND formule_complete_remaining >= 0
        AND formule_complete_remaining <= formule_complete_total
        AND galette_total >= 0
        AND galette_remaining >= 0
        AND galette_remaining <= galette_total
        AND crepe_total >= 0
        AND crepe_remaining >= 0
        AND crepe_remaining <= crepe_total
      ) NOT VALID;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'quiz_participations_score_valid') THEN
    ALTER TABLE public.quiz_participations
      ADD CONSTRAINT quiz_participations_score_valid
      CHECK (total_questions > 0 AND score >= 0 AND score <= total_questions) NOT VALID;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'quiz_participations_claim_requires_code') THEN
    ALTER TABLE public.quiz_participations
      ADD CONSTRAINT quiz_participations_claim_requires_code
      CHECK (prize_claimed = false OR prize_code IS NOT NULL) NOT VALID;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'quiz_sessions_current_question_valid') THEN
    ALTER TABLE public.quiz_sessions
      ADD CONSTRAINT quiz_sessions_current_question_valid
      CHECK (current_question >= 0 AND current_question <= 10) NOT VALID;
  END IF;
END $$;

-- 5. Faster lookups used by the Edge Functions.
CREATE INDEX IF NOT EXISTS idx_quiz_participations_week_email_winner
ON public.quiz_participations (week_start, lower(email))
WHERE prize_won IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_quiz_participations_week_phone_winner
ON public.quiz_participations (week_start, phone)
WHERE prize_won IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_quiz_participations_week_device_winner
ON public.quiz_participations (week_start, device_fingerprint)
WHERE prize_won IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_quiz_sessions_open_device_activity
ON public.quiz_sessions (device_fingerprint, completed, expires_at DESC);

-- 6. Keep quiz session storage tidy without deleting recent active sessions.
CREATE OR REPLACE FUNCTION public.cleanup_expired_quiz_sessions()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.quiz_sessions
  WHERE expires_at < now() - interval '1 day'
    AND completed = true;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.cleanup_expired_quiz_sessions() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_quiz_sessions() TO service_role;
