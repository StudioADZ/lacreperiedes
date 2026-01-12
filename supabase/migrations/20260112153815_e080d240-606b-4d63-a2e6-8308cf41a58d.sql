-- Update secret_menu table with new structure
ALTER TABLE public.secret_menu 
ADD COLUMN IF NOT EXISTS valid_from TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN IF NOT EXISTS valid_to TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '7 days'),
ADD COLUMN IF NOT EXISTS galette_items JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS crepe_items JSONB DEFAULT '[]'::jsonb;

-- Create index for date validation queries
CREATE INDEX IF NOT EXISTS idx_secret_menu_validity ON public.secret_menu(valid_from, valid_to);

-- Create secret_access table to track who accessed the menu
CREATE TABLE IF NOT EXISTS public.secret_access (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  first_name TEXT NOT NULL,
  access_token TEXT NOT NULL UNIQUE,
  secret_code TEXT NOT NULL,
  week_start TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days')
);

-- Enable RLS
ALTER TABLE public.secret_access ENABLE ROW LEVEL SECURITY;

-- Public can insert (to request access)
CREATE POLICY "Anyone can request secret access" 
ON public.secret_access 
FOR INSERT 
WITH CHECK (true);

-- Public can read their own access by token
CREATE POLICY "Anyone can verify access by token" 
ON public.secret_access 
FOR SELECT 
USING (true);

-- Create index for token lookups
CREATE INDEX IF NOT EXISTS idx_secret_access_token ON public.secret_access(access_token);
CREATE INDEX IF NOT EXISTS idx_secret_access_email_week ON public.secret_access(email, week_start);

-- Function to generate access token
CREATE OR REPLACE FUNCTION public.generate_access_token()
RETURNS TEXT AS $$
BEGIN
  RETURN encode(gen_random_bytes(16), 'hex');
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Function to grant secret access
CREATE OR REPLACE FUNCTION public.grant_secret_access(
  p_email TEXT,
  p_phone TEXT,
  p_first_name TEXT,
  p_secret_code TEXT,
  p_week_start TEXT
)
RETURNS TEXT AS $$
DECLARE
  v_token TEXT;
  v_existing TEXT;
BEGIN
  -- Check if already has access this week
  SELECT access_token INTO v_existing
  FROM public.secret_access
  WHERE email = p_email AND week_start = p_week_start;
  
  IF v_existing IS NOT NULL THEN
    RETURN v_existing;
  END IF;
  
  -- Generate new token
  v_token := public.generate_access_token();
  
  INSERT INTO public.secret_access (email, phone, first_name, access_token, secret_code, week_start)
  VALUES (p_email, p_phone, p_first_name, v_token, p_secret_code, p_week_start);
  
  RETURN v_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to verify access token
CREATE OR REPLACE FUNCTION public.verify_secret_access(p_token TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.secret_access
    WHERE access_token = p_token
    AND expires_at > now()
  );
END;
$$ LANGUAGE plpgsql SET search_path = public;