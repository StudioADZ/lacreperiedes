
-- 1) Drop vulnerable SECURITY DEFINER functions (unused, no auth checks)
DROP FUNCTION IF EXISTS public.unlock_secret_menu_for_user(UUID, TEXT);
DROP FUNCTION IF EXISTS public.add_loyalty_points(UUID, INTEGER);

-- 2) quiz_questions: block direct client access to prevent correct_answer exposure
-- Edge functions use service_role which bypasses RLS entirely
DROP POLICY IF EXISTS "Allow reading questions without correct_answer" ON public.quiz_questions;

CREATE POLICY "Block direct client access to questions"
ON public.quiz_questions
FOR SELECT
TO anon, authenticated
USING (false);

-- 3) messages: block client SELECT and UPDATE, route through edge function
DROP POLICY IF EXISTS "Service role can read messages" ON public.messages;
DROP POLICY IF EXISTS "Service role can update messages" ON public.messages;

CREATE POLICY "Block client read messages"
ON public.messages
FOR SELECT
TO anon, authenticated
USING (false);

CREATE POLICY "Block client update messages"
ON public.messages
FOR UPDATE
TO anon, authenticated
USING (false);
