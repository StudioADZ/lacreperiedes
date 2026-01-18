-- Fix RLS policies for messages table
-- Drop overly permissive SELECT policy
DROP POLICY IF EXISTS "Service role can read messages" ON public.messages;

-- Create restrictive SELECT policy for service_role only
CREATE POLICY "Service role can read messages"
ON public.messages
FOR SELECT
TO service_role
USING (true);

-- Fix RLS policies for admin_settings table
-- Drop overly permissive SELECT policy
DROP POLICY IF EXISTS "Service role can read settings" ON public.admin_settings;

-- Drop overly permissive UPDATE policy
DROP POLICY IF EXISTS "Service role can update settings" ON public.admin_settings;

-- Drop overly permissive INSERT policy  
DROP POLICY IF EXISTS "Service role can insert settings" ON public.admin_settings;

-- Create restrictive SELECT policy for service_role only
CREATE POLICY "Service role can read settings"
ON public.admin_settings
FOR SELECT
TO service_role
USING (true);

-- Create restrictive UPDATE policy for service_role only
CREATE POLICY "Service role can update settings"
ON public.admin_settings
FOR UPDATE
TO service_role
USING (true);

-- Create restrictive INSERT policy for service_role only
CREATE POLICY "Service role can insert settings"
ON public.admin_settings
FOR INSERT
TO service_role
WITH CHECK (true);