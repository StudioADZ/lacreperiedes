-- =====================================================
-- LA CRÊPERIE DES SAVEURS - QUIZ SYSTEM DATABASE
-- =====================================================

-- 1. QUIZ QUESTIONS TABLE
CREATE TABLE public.quiz_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_answer TEXT NOT NULL CHECK (correct_answer IN ('A', 'B', 'C', 'D')),
  category TEXT NOT NULL DEFAULT 'local', -- 'local' (Sarthe/Mamers) or 'food' (crêpes)
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. WEEKLY STOCK TABLE (tracks prize inventory per week)
CREATE TABLE public.weekly_stock (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  week_start DATE NOT NULL, -- Sunday of the week
  formule_complete_total INTEGER NOT NULL DEFAULT 10,
  formule_complete_remaining INTEGER NOT NULL DEFAULT 10,
  galette_total INTEGER NOT NULL DEFAULT 20,
  galette_remaining INTEGER NOT NULL DEFAULT 20,
  crepe_total INTEGER NOT NULL DEFAULT 30,
  crepe_remaining INTEGER NOT NULL DEFAULT 30,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(week_start)
);

-- 3. QUIZ PARTICIPATIONS TABLE (tracks each quiz attempt)
CREATE TABLE public.quiz_participations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  device_fingerprint TEXT NOT NULL, -- for fraud detection
  week_start DATE NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  total_questions INTEGER NOT NULL DEFAULT 10,
  prize_won TEXT, -- 'formule_complete', 'galette', 'crepe', or null
  prize_code TEXT UNIQUE, -- unique code for QR
  prize_claimed BOOLEAN NOT NULL DEFAULT false,
  claimed_at TIMESTAMP WITH TIME ZONE,
  rgpd_consent BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. QUIZ SESSIONS TABLE (tracks active quiz sessions with questions)
CREATE TABLE public.quiz_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  device_fingerprint TEXT NOT NULL,
  question_ids UUID[] NOT NULL,
  current_question INTEGER NOT NULL DEFAULT 0,
  answers JSONB NOT NULL DEFAULT '[]'::jsonb,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_activity TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '5 minutes'),
  completed BOOLEAN NOT NULL DEFAULT false
);

-- Create indexes for performance
CREATE INDEX idx_quiz_questions_active ON public.quiz_questions(is_active);
CREATE INDEX idx_quiz_questions_category ON public.quiz_questions(category);
CREATE INDEX idx_weekly_stock_week ON public.weekly_stock(week_start);
CREATE INDEX idx_participations_week ON public.quiz_participations(week_start);
CREATE INDEX idx_participations_phone_week ON public.quiz_participations(phone, week_start);
CREATE INDEX idx_participations_device_week ON public.quiz_participations(device_fingerprint, week_start);
CREATE INDEX idx_participations_code ON public.quiz_participations(prize_code);
CREATE INDEX idx_sessions_device ON public.quiz_sessions(device_fingerprint);
CREATE INDEX idx_sessions_expires ON public.quiz_sessions(expires_at);

-- Enable RLS on all tables
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_participations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_sessions ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES

-- Quiz questions: public read for active questions
CREATE POLICY "Anyone can read active questions"
ON public.quiz_questions FOR SELECT
USING (is_active = true);

-- Weekly stock: public read
CREATE POLICY "Anyone can read weekly stock"
ON public.weekly_stock FOR SELECT
USING (true);

-- Quiz participations: public insert (for submitting quiz)
CREATE POLICY "Anyone can create participation"
ON public.quiz_participations FOR INSERT
WITH CHECK (true);

-- Quiz participations: public read own participation by code
CREATE POLICY "Anyone can read participation by code"
ON public.quiz_participations FOR SELECT
USING (true);

-- Quiz sessions: public CRUD (managed by device fingerprint)
CREATE POLICY "Anyone can manage quiz sessions"
ON public.quiz_sessions FOR ALL
USING (true)
WITH CHECK (true);

-- Function to get current week start (Sunday)
CREATE OR REPLACE FUNCTION public.get_current_week_start()
RETURNS DATE AS $$
BEGIN
  -- Get the most recent Sunday (start of week in Paris time)
  RETURN (date_trunc('week', (now() AT TIME ZONE 'Europe/Paris')::date + 1) - interval '1 day')::date;
END;
$$ LANGUAGE plpgsql STABLE SET search_path = public;

-- Function to generate unique prize code
CREATE OR REPLACE FUNCTION public.generate_prize_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Function to ensure weekly stock exists for current week
CREATE OR REPLACE FUNCTION public.ensure_weekly_stock()
RETURNS public.weekly_stock AS $$
DECLARE
  current_week DATE;
  stock_record public.weekly_stock;
BEGIN
  current_week := public.get_current_week_start();
  
  -- Try to get existing stock
  SELECT * INTO stock_record FROM public.weekly_stock WHERE week_start = current_week;
  
  -- If not exists, create it
  IF stock_record IS NULL THEN
    INSERT INTO public.weekly_stock (week_start)
    VALUES (current_week)
    RETURNING * INTO stock_record;
  END IF;
  
  RETURN stock_record;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Function to decrement stock and return success
CREATE OR REPLACE FUNCTION public.claim_prize(
  p_prize_type TEXT,
  p_week_start DATE
)
RETURNS BOOLEAN AS $$
DECLARE
  affected_rows INTEGER;
BEGIN
  IF p_prize_type = 'formule_complete' THEN
    UPDATE public.weekly_stock 
    SET formule_complete_remaining = formule_complete_remaining - 1
    WHERE week_start = p_week_start AND formule_complete_remaining > 0;
  ELSIF p_prize_type = 'galette' THEN
    UPDATE public.weekly_stock 
    SET galette_remaining = galette_remaining - 1
    WHERE week_start = p_week_start AND galette_remaining > 0;
  ELSIF p_prize_type = 'crepe' THEN
    UPDATE public.weekly_stock 
    SET crepe_remaining = crepe_remaining - 1
    WHERE week_start = p_week_start AND crepe_remaining > 0;
  ELSE
    RETURN false;
  END IF;
  
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  RETURN affected_rows > 0;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Insert initial quiz questions (80% local Sarthe/Mamers, 20% food/crêpes)
INSERT INTO public.quiz_questions (question, option_a, option_b, option_c, option_d, correct_answer, category) VALUES
-- LOCAL QUESTIONS (Sarthe / Mamers / Perche)
('Dans quel département se trouve Mamers ?', 'Mayenne', 'Sarthe', 'Orne', 'Eure-et-Loir', 'B', 'local'),
('Quel est le nom de la place principale de Mamers ?', 'Place de la République', 'Place Carnot', 'Place du Marché', 'Place de l''Église', 'B', 'local'),
('La Crêperie des Saveurs se situe dans quelle galerie ?', 'Galerie Marchande', 'Galerie des Halles', 'Galerie du Centre', 'Galerie Carnot', 'B', 'local'),
('Quelle rivière traverse Mamers ?', 'La Sarthe', 'La Dive', 'L''Huisne', 'Le Loir', 'B', 'local'),
('Mamers est la capitale historique de quelle région ?', 'Le Maine', 'Le Perche Sarthois', 'La Beauce', 'Le Vendômois', 'B', 'local'),
('Quel célèbre circuit automobile se trouve dans la Sarthe ?', 'Circuit de Magny-Cours', 'Circuit des 24 Heures du Mans', 'Circuit Paul Ricard', 'Circuit de Nevers', 'B', 'local'),
('Quelle est la préfecture du département de la Sarthe ?', 'Mamers', 'La Flèche', 'Le Mans', 'Sablé-sur-Sarthe', 'C', 'local'),
('Quel produit est une spécialité culinaire du Mans ?', 'Les rillettes', 'Le camembert', 'Le beurre salé', 'La galette-saucisse', 'A', 'local'),
('Combien d''habitants compte environ Mamers ?', '3 000', '5 500', '8 000', '12 000', 'B', 'local'),
('Quel roi de France est né au Mans ?', 'Louis XIV', 'Henri II', 'François Ier', 'Charles VII', 'B', 'local'),
('La cathédrale du Mans est dédiée à quel saint ?', 'Saint Pierre', 'Saint Julien', 'Saint Martin', 'Saint Michel', 'B', 'local'),
('Quel constructeur automobile a son siège au Mans ?', 'Renault', 'Peugeot', 'MMA', 'Aucun', 'D', 'local'),
('Le Perche est réputé pour quelle race d''animal ?', 'Vache', 'Cheval', 'Mouton', 'Porc', 'B', 'local'),
('Quelle abbaye célèbre se trouve près de Mamers ?', 'Abbaye de Solesmes', 'Abbaye de Fontevraud', 'Abbaye du Mont-Saint-Michel', 'Abbaye de Cluny', 'A', 'local'),
('En quelle année Mamers a-t-elle été fondée ?', 'Époque gallo-romaine', 'Moyen Âge', 'Renaissance', 'XVIIIe siècle', 'A', 'local'),
('Quel événement sportif majeur a lieu chaque année au Mans ?', 'Tour de France', '24 Heures du Mans', 'Paris-Roubaix', 'Marathon de Paris', 'B', 'local'),
('De quel pays vient le fondateur de La Crêperie des Saveurs ?', 'Sénégal', 'Côte d''Ivoire', 'Togo', 'Cameroun', 'C', 'local'),
('Depuis combien d''années Amatekoe travaille dans la restauration ?', '5 ans', '8 ans', '12 ans', '15 ans', 'C', 'local'),
('En quelle année Amatekoe est-il arrivé en France ?', '1990', '1997', '2002', '2010', 'B', 'local'),
('Dans quelle ville du Togo est né Amatekoe ?', 'Kara', 'Lomé', 'Sokodé', 'Atakpamé', 'B', 'local'),

-- FOOD / CRÊPES QUESTIONS (20%)
('De quelle région française vient traditionnellement la galette ?', 'Normandie', 'Bretagne', 'Pays de la Loire', 'Picardie', 'B', 'food'),
('Quel ingrédient principal distingue une galette d''une crêpe ?', 'Le beurre', 'Le sarrasin', 'Le sucre', 'Les œufs', 'B', 'food'),
('Quelle farine utilise-t-on pour les crêpes sucrées ?', 'Farine de sarrasin', 'Farine de froment', 'Farine de maïs', 'Farine de riz', 'B', 'food'),
('Comment appelle-t-on la plaque pour cuire les crêpes ?', 'Poêle', 'Bilig', 'Plancha', 'Crêpier', 'B', 'food'),
('Quel est le nom du cidre doux en Bretagne ?', 'Cidre brut', 'Cidre bouché', 'Cidre doux', 'Petit cidre', 'C', 'food'),
('La Chandeleur est fêtée le 2 de quel mois ?', 'Janvier', 'Février', 'Mars', 'Avril', 'B', 'food'),
('Quelle garniture classique accompagne une galette complète ?', 'Jambon, œuf, fromage', 'Poulet, légumes', 'Saumon, crème', 'Champignons, lardons', 'A', 'food'),
('Quel ustensile étale la pâte à crêpe sur le bilig ?', 'Spatule', 'Rozell', 'Louche', 'Cuillère', 'B', 'food'),
('Le sarrasin est-il une céréale ?', 'Oui', 'Non, c''est une pseudo-céréale', 'C''est un légume', 'C''est une légumineuse', 'B', 'food'),
('Quelle boisson accompagne traditionnellement les crêpes en Bretagne ?', 'Vin rouge', 'Cidre', 'Bière', 'Jus de pomme', 'B', 'food');

-- Ensure current week stock exists
SELECT public.ensure_weekly_stock();