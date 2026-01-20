-- Fix security issues:
-- 1. Drop the security definer view (will use direct table query instead)
DROP VIEW IF EXISTS public.carte_public_view;

-- 2. Update carte_public RLS policy to be more restrictive
-- Only service role (edge functions) can modify, public can only read
DROP POLICY IF EXISTS "Service role can manage carte" ON public.carte_public;

-- Service role bypasses RLS by default, no policy needed for admin writes
-- The edge function uses service role key which bypasses RLS