-- Fix RLS policies to allow proper quiz functionality

-- Drop restrictive policies that block everything
DROP POLICY IF EXISTS "Verify prize code only" ON public.quiz_participations;
DROP POLICY IF EXISTS "No direct session access" ON public.quiz_sessions;
DROP POLICY IF EXISTS "No direct session insert" ON public.quiz_sessions;
DROP POLICY IF EXISTS "No direct session update" ON public.quiz_sessions;

-- Quiz questions - ensure public can read active questions (fix the RESTRICTIVE policy)
DROP POLICY IF EXISTS "Anyone can read active questions" ON public.quiz_questions;
CREATE POLICY "Public can read active questions"
ON public.quiz_questions FOR SELECT
USING (is_active = true);

-- Weekly stock - ensure public can read (fix the RESTRICTIVE policy)  
DROP POLICY IF EXISTS "Anyone can read weekly stock" ON public.weekly_stock;
CREATE POLICY "Public can read weekly stock"
ON public.weekly_stock FOR SELECT
USING (true);