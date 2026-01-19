-- =====================================================
-- SAFE PATCH: Ensure public read for active quiz questions + weekly stock
-- Non-destructive: does NOT drop existing policies
-- =====================================================

-- 1) quiz_questions: allow public read for active questions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'quiz_questions'
      AND policyname = 'public_read_active_quiz_questions'
  ) THEN
    CREATE POLICY public_read_active_quiz_questions
    ON public.quiz_questions
    FOR SELECT
    USING (is_active = true);
  END IF;
END $$;

-- 2) weekly_stock: allow public read
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'weekly_stock'
      AND policyname = 'public_read_weekly_stock'
  ) THEN
    CREATE POLICY public_read_weekly_stock
    ON public.weekly_stock
    FOR SELECT
    USING (true);
  END IF;
END $$;
