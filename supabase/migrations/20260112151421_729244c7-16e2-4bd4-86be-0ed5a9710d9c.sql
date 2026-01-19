-- First create the update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Table pour le menu secret dynamique
CREATE TABLE public.secret_menu (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  week_start DATE NOT NULL,
  menu_name TEXT NOT NULL DEFAULT 'Menu Secret du Week-end',
  secret_code TEXT NOT NULL DEFAULT 'CREPE2025',
  galette_special TEXT,
  galette_special_description TEXT,
  crepe_special TEXT,
  crepe_special_description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(week_start)
);

-- Enable RLS
ALTER TABLE public.secret_menu ENABLE ROW LEVEL SECURITY;

-- Public read policy for active menus
CREATE POLICY "Anyone can read active secret menus"
ON public.secret_menu
FOR SELECT
USING (is_active = true);

-- Function to get or create current week secret menu
CREATE OR REPLACE FUNCTION public.ensure_secret_menu()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_week_start DATE;
  v_menu_id UUID;
BEGIN
  SELECT (date_trunc('week', now() AT TIME ZONE 'Europe/Paris'))::date INTO v_week_start;
  
  -- Check if menu exists for this week
  SELECT id INTO v_menu_id FROM secret_menu WHERE week_start = v_week_start;
  
  IF v_menu_id IS NULL THEN
    -- Create new menu for this week
    INSERT INTO secret_menu (week_start)
    VALUES (v_week_start)
    RETURNING id INTO v_menu_id;
  END IF;
  
  RETURN v_menu_id;
END;
$$;

-- Trigger for updated_at
CREATE TRIGGER update_secret_menu_updated_at
BEFORE UPDATE ON public.secret_menu
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();