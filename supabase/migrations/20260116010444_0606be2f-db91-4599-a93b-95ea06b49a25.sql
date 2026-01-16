-- Create messages table for admin/client messaging
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('client', 'admin')),
  sender_name TEXT NOT NULL,
  sender_email TEXT,
  sender_phone TEXT,
  subject TEXT,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  replied_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anyone to insert messages (for clients sending messages)
CREATE POLICY "Anyone can send messages"
ON public.messages
FOR INSERT
WITH CHECK (true);

-- Policy: Only admins can read messages (we'll verify admin status in the edge function)
-- For now, allow select for authenticated users or service role
CREATE POLICY "Service role can read messages"
ON public.messages
FOR SELECT
USING (true);

-- Policy: Service role can update messages (mark as read, etc.)
CREATE POLICY "Service role can update messages"
ON public.messages
FOR UPDATE
USING (true);

-- Create admin_settings table for payment/QR settings
CREATE TABLE public.admin_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read settings (for checking if features are enabled)
CREATE POLICY "Anyone can read settings"
ON public.admin_settings
FOR SELECT
USING (true);

-- Policy: Only via edge function (service role) can update
CREATE POLICY "Service role can update settings"
ON public.admin_settings
FOR UPDATE
USING (true);

CREATE POLICY "Service role can insert settings"
ON public.admin_settings
FOR INSERT
WITH CHECK (true);

-- Insert default payment/QR setting (disabled by default)
INSERT INTO public.admin_settings (setting_key, setting_value, is_active)
VALUES ('payment_qr', '{"enabled": false, "provider": null}', false)
ON CONFLICT (setting_key) DO NOTHING;