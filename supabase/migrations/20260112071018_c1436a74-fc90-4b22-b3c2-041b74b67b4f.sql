-- =====================================================
-- SAFE PATCH: splash_settings (non-destructive)
-- =====================================================

-- 1) Create table safely
CREATE TABLE IF NOT EXISTS public.splash_settings (
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

-- 2) Enable RLS (idempotent)
ALTER TABLE public.splash_settings ENABLE ROW LEVEL SECURITY;

-- 3) Ensure only ONE active row at a time (non-destructive)
-- This prevents multiple active configs (which would make "limit=1" ambiguous).
CREATE UNIQUE INDEX IF NOT EXISTS ux_splash_settings_single_active
  ON public.splash_settings ((is_active))
  WHERE (is_active = true);

-- 4) Policy: public can read ONLY active splash settings
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='splash_settings'
      AND policyname='Anyone can read splash settings'
  ) THEN
    DROP POLICY "Anyone can read splash settings" ON public.splash_settings;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='splash_settings'
      AND policyname='Public can read active splash settings'
  ) THEN
    CREATE POLICY "Public can read active splash settings"
    ON public.splash_settings
    FOR SELECT
    USING (is_active = true);
  END IF;
END $$;

-- 5) Optional: auto-update updated_at on UPDATE (safe)
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trg_splash_settings_updated_at'
  ) THEN
    CREATE TRIGGER trg_splash_settings_updated_at
    BEFORE UPDATE ON public.splash_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

-- 6) Insert default row safely (idempotent)
-- If you already have an active row, do nothing.
INSERT INTO public.splash_settings (event_title, event_subtitle, game_line, cta_text, is_active)
SELECT
  '🎉 Quiz & Récompenses',
  'Crêpes & Galettes artisanales – Mamers',
  'Jeu & récompenses en cours',
  'Entrer dans la Crêperie',
  true
WHERE NOT EXISTS (
  SELECT 1 FROM public.splash_settings WHERE is_active = true
);
