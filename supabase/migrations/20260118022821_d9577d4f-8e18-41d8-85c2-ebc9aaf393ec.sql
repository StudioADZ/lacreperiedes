-- =====================================================
-- SAFE RLS PATCH: messages + admin_settings
-- (non-destructif: complète et verrouille proprement)
-- =====================================================

-- -------------------------
-- MESSAGES
-- -------------------------
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Drop known overly permissive policies (names may vary in your history)
DROP POLICY IF EXISTS "Service role can read messages" ON public.messages;
DROP POLICY IF EXISTS "Service role can update messages" ON public.messages;
DROP POLICY IF EXISTS "Service role can insert messages" ON public.messages;
DROP POLICY IF EXISTS "Anyone can read messages" ON public.messages;
DROP POLICY IF EXISTS "Anyone can update messages" ON public.messages;

-- Keep/replace public INSERT but with minimal validation
DROP POLICY IF EXISTS "Anyone can send messages" ON public.messages;
CREATE POLICY "Public can send messages (validated)"
ON public.messages
FOR INSERT
TO anon, authenticated
WITH CHECK (
  sender_type IN ('client', 'admin')
  AND length(sender_name) BETWEEN 1 AND 80
  AND length(message) BETWEEN 1 AND 5000
);

-- Explicitly block direct client reads/updates (PII)
CREATE POLICY "No direct read messages"
ON public.messages
FOR SELECT
TO anon, authenticated
USING (false);

CREATE POLICY "No direct update messages"
ON public.messages
FOR UPDATE
TO anon, authenticated
USING (false)
WITH CHECK (false);

-- Optional: allow service_role explicitly (harmless; service_role key bypasses RLS anyway)
CREATE POLICY "Service role can read messages"
ON public.messages
FOR SELECT
TO service_role
USING (true);

CREATE POLICY "Service role can update messages"
ON public.messages
FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);


-- -------------------------
-- ADMIN_SETTINGS
-- -------------------------
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- Drop permissive policies (important: also drop the public one if it exists)
DROP POLICY IF EXISTS "Anyone can read settings" ON public.admin_settings;
DROP POLICY IF EXISTS "Service role can read settings" ON public.admin_settings;
DROP POLICY IF EXISTS "Service role can update settings" ON public.admin_settings;
DROP POLICY IF EXISTS "Service role can insert settings" ON public.admin_settings;

-- ✅ SAFE OPTION: public can read only whitelisted keys (so front feature flags still work)
-- If you want FULL lockdown, comment this and keep "No direct read settings" below.
CREATE POLICY "Public can read safe settings only"
ON public.admin_settings
FOR SELECT
TO anon, authenticated
USING (setting_key IN ('payment_qr'));

-- Hard block any direct client writes
CREATE POLICY "No direct insert settings"
ON public.admin_settings
FOR INSERT
TO anon, authenticated
WITH CHECK (false);

CREATE POLICY "No direct update settings"
ON public.admin_settings
FOR UPDATE
TO anon, authenticated
USING (false)
WITH CHECK (false);

-- Service role full access (optional but clear)
CREATE POLICY "Service role can read settings"
ON public.admin_settings
FOR SELECT
TO service_role
USING (true);

CREATE POLICY "Service role can update settings"
ON public.admin_settings
FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role can insert settings"
ON public.admin_settings
FOR INSERT
TO service_role
WITH CHECK (true);
