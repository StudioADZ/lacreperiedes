-- Fix social_posts: Remove permissive policy, keep SELECT for visible posts only
DROP POLICY IF EXISTS "Allow all operations for now" ON public.social_posts;

-- Fix quiz_participations: Remove any overly permissive policies and restrict access
-- First, let's see what policies exist and drop them
DROP POLICY IF EXISTS "Anyone can read participations" ON public.quiz_participations;
DROP POLICY IF EXISTS "Allow read access" ON public.quiz_participations;
DROP POLICY IF EXISTS "Public can read participations" ON public.quiz_participations;
DROP POLICY IF EXISTS "Everyone can read quiz participations" ON public.quiz_participations;

-- Ensure RLS is enabled on quiz_participations
ALTER TABLE public.quiz_participations ENABLE ROW LEVEL SECURITY;

-- Create restrictive policy: Only allow reading by prize_code for verification
-- Edge functions with service role key can still read everything
CREATE POLICY "Verify by prize code only"
ON public.quiz_participations
FOR SELECT
USING (false);

-- Note: Edge functions use service_role key which bypasses RLS
-- This policy blocks all direct client access while allowing verification through edge functions