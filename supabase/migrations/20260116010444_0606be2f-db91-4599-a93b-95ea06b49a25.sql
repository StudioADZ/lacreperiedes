-- =====================================================
-- SAFE HARDENING: messages
-- =====================================================

-- Add some guardrails (optional but recommended)
ALTER TABLE public.messages
  ALTER COLUMN sender_type SET NOT NULL,
  ALTER COLUMN sender_name SET NOT NULL,
  ALTER COLUMN message SET NOT NULL;

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON public.messages(is_read);
CREATE INDEX IF NOT EXISTS idx_messages_sender_type ON public.messages(sender_type);

-- Tighten RLS: drop overly broad policies (if they already exist)
DROP POLICY IF EXISTS "Service role can read messages" ON public.messages;
DROP POLICY IF EXISTS "Service role can update messages" ON public.messages;

-- Keep public INSERT but with minimal checks (anti-trash)
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

-- Block all direct client reads/updates (service role via Edge Functions bypasses anyway)
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
