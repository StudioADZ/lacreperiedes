-- Create splash_settings table for dynamic event configuration
CREATE TABLE public.splash_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_title TEXT NOT NULL DEFAULT '🎉 Quiz & Récompenses',
  event_subtitle TEXT NOT NULL DEFAULT 'Crêpes & Galettes artisanales – Mamers',
  game_line TEXT NOT NULL DEFAULT 'Jeu & récompenses en cours',
  cta_text TEXT NOT NULL DEFAULT 'Entrer dans la Crêperie',
  background_image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.splash_settings ENABLE ROW LEVEL SECURITY;

-- Public read access for the splash screen display
CREATE POLICY "Anyone can read splash settings"
ON public.splash_settings
FOR SELECT
USING (true);

-- Insert default settings
INSERT INTO public.splash_settings (event_title, event_subtitle, game_line, cta_text)
VALUES ('🎉 Quiz & Récompenses', 'Crêpes & Galettes artisanales – Mamers', 'Jeu & récompenses en cours', 'Entrer dans la Crêperie');