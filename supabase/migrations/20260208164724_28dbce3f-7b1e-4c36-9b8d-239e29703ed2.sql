
-- 1. Block direct reads on secret_menu to protect secret_code and daily_code_seed
DROP POLICY IF EXISTS "Allow reading menu without secret_code" ON public.secret_menu;
CREATE POLICY "Block direct menu reads" ON public.secret_menu FOR SELECT USING (false);

-- 2. Create quiz_winners_public view (safe fields only, no PII like email/phone/device_fingerprint/prize_code)
CREATE OR REPLACE VIEW public.quiz_winners_public WITH (security_barrier = true) AS
  SELECT id, first_name, prize_won, score, total_questions, created_at, week_start, status
  FROM public.quiz_participations
  WHERE prize_won IS NOT NULL;

GRANT SELECT ON public.quiz_winners_public TO anon, authenticated;
