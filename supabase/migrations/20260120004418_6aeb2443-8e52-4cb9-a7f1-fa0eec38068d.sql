-- Create carte_public table for the public menu (separate from secret menu)
CREATE TABLE IF NOT EXISTS public.carte_public (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  galette_items JSONB DEFAULT '[]'::jsonb,
  crepe_items JSONB DEFAULT '[]'::jsonb
);

-- Enable RLS
ALTER TABLE public.carte_public ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Public can view active carte" 
  ON public.carte_public 
  FOR SELECT 
  USING (is_active = true);

-- Allow authenticated admin updates (via edge function)
CREATE POLICY "Service role can manage carte" 
  ON public.carte_public 
  FOR ALL 
  USING (true);

-- Insert default empty carte
INSERT INTO public.carte_public (is_active, galette_items, crepe_items)
VALUES (true, '[]'::jsonb, '[]'::jsonb)
ON CONFLICT DO NOTHING;

-- Add daily_code column to secret_menu if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'secret_menu' 
    AND column_name = 'daily_code_seed'
  ) THEN
    ALTER TABLE public.secret_menu ADD COLUMN daily_code_seed TEXT DEFAULT NULL;
  END IF;
END $$;

-- Create function to generate daily code from secret_code + date
CREATE OR REPLACE FUNCTION public.get_daily_code(p_secret_code TEXT, p_date DATE DEFAULT CURRENT_DATE)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
  day_seed TEXT;
  hash_val BIGINT;
  code_chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INT;
BEGIN
  -- Create seed from secret_code + date
  day_seed := p_secret_code || to_char(p_date, 'YYYYMMDD');
  
  -- Simple hash
  hash_val := abs(hashtext(day_seed));
  
  -- Generate 6-character code
  FOR i IN 1..6 LOOP
    result := result || substr(code_chars, (hash_val % length(code_chars)) + 1, 1);
    hash_val := hash_val / length(code_chars);
  END LOOP;
  
  RETURN result;
END;
$$;

-- Create view for public carte
CREATE OR REPLACE VIEW public.carte_public_view AS
SELECT 
  id,
  galette_items,
  crepe_items,
  updated_at
FROM public.carte_public
WHERE is_active = true
LIMIT 1;