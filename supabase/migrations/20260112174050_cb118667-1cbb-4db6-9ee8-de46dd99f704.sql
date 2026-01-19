-- =============================================
-- CRITICAL SECURITY PATCH - GDPR COMPLIANCE
-- =============================================

-- 1) LOCK DOWN secret_access (currently exposes emails, phones, tokens)
-- Drop overly permissive policies
DROP POLICY IF EXISTS "Anyone can verify access by token" ON public.secret_access;
DROP POLICY IF EXISTS "Anyone can request secret access" ON public.secret_access;

-- New restrictive policies for secret_access
-- SELECT: Only allow reading own row by access_token (used by verify_secret_access function)
CREATE POLICY "Read own access by token"
ON public.secret_access
FOR SELECT
USING (false); -- Block all direct client reads; use verify_secret_access RPC instead

-- INSERT: Block direct inserts; must go through grant_secret_access RPC
CREATE POLICY "No direct insert"
ON public.secret_access
FOR INSERT
WITH CHECK (false); -- Block all direct client inserts; use grant_secret_access RPC

-- 2) PROTECT quiz_sessions (currently no restrictions)
-- Drop any existing policies
DROP POLICY IF EXISTS "Anyone can read sessions" ON public.quiz_sessions;
DROP POLICY IF EXISTS "Anyone can access sessions" ON public.quiz_sessions;
DROP POLICY IF EXISTS "Public can access sessions" ON public.quiz_sessions;

-- Enable RLS (already enabled, but ensure)
ALTER TABLE public.quiz_sessions ENABLE ROW LEVEL SECURITY;

-- New restrictive policies
-- SELECT/UPDATE/INSERT all handled by edge functions with service role
-- Block all direct client access
CREATE POLICY "No direct session access"
ON public.quiz_sessions
FOR ALL
USING (false)
WITH CHECK (false);

-- 3) SECURE quiz_participations (already has some protection but needs INSERT policy)
-- Drop any existing INSERT policies
DROP POLICY IF EXISTS "Anyone can insert participation" ON public.quiz_participations;
DROP POLICY IF EXISTS "Public can insert participation" ON public.quiz_participations;

-- Block direct inserts; must go through quiz-submit edge function
CREATE POLICY "No direct participation insert"
ON public.quiz_participations
FOR INSERT
WITH CHECK (false);

-- 4) Secure the SECURITY DEFINER functions by adding proper checks
-- Update ensure_secret_menu to be SECURITY INVOKER (safer)
CREATE OR REPLACE FUNCTION public.ensure_secret_menu()
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
    current_week DATE;
    menu_id UUID;
BEGIN
    current_week := (SELECT get_current_week_start());
    
    -- Check if menu exists for current week
    SELECT id INTO menu_id FROM secret_menu 
    WHERE week_start = current_week 
    AND is_active = true
    LIMIT 1;
    
    IF menu_id IS NULL THEN
        -- This will now fail due to RLS if not called with service role
        -- which is the intended behavior
        INSERT INTO secret_menu (week_start, is_active)
        VALUES (current_week, true)
        RETURNING id INTO menu_id;
    END IF;
    
    RETURN menu_id;
END;
$$;

-- 5) Add RLS to secret_menu for INSERT/UPDATE/DELETE (admin only via service role)
DROP POLICY IF EXISTS "Admin can manage secret menus" ON public.secret_menu;

CREATE POLICY "No direct menu modifications"
ON public.secret_menu
FOR INSERT
WITH CHECK (false);

CREATE POLICY "No direct menu updates"
ON public.secret_menu
FOR UPDATE
USING (false);

CREATE POLICY "No direct menu deletes"
ON public.secret_menu
FOR DELETE
USING (false);