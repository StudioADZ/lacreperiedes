-- Add daily_code_seed column if not exists (for daily code generation)
ALTER TABLE public.secret_menu 
ADD COLUMN IF NOT EXISTS daily_code_seed text DEFAULT NULL;

-- Create function to generate daily code based on week_start and date
CREATE OR REPLACE FUNCTION public.get_daily_code(p_week_start date DEFAULT NULL)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_menu record;
  v_seed text;
  v_today text;
  v_hash text;
  v_code text;
BEGIN
  -- Get active menu
  SELECT * INTO v_menu 
  FROM secret_menu 
  WHERE is_active = true 
    AND (p_week_start IS NULL OR week_start = p_week_start)
  ORDER BY week_start DESC 
  LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;
  
  -- Use daily_code_seed if set, otherwise use secret_code
  v_seed := COALESCE(v_menu.daily_code_seed, v_menu.secret_code);
  v_today := to_char(CURRENT_DATE, 'YYYY-MM-DD');
  
  -- Generate hash-based code: take first 4 chars of MD5 + day number
  v_hash := encode(digest(v_seed || v_today, 'md5'), 'hex');
  v_code := upper(substring(v_hash from 1 for 4)) || to_char(CURRENT_DATE, 'DD');
  
  RETURN v_code;
END;
$$;

-- Create function to validate code (daily or weekly for winners)
CREATE OR REPLACE FUNCTION public.validate_secret_code(p_code text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_menu record;
  v_daily_code text;
  v_normalized_code text;
BEGIN
  v_normalized_code := upper(trim(p_code));
  
  -- Get active menu
  SELECT * INTO v_menu 
  FROM secret_menu 
  WHERE is_active = true
    AND (valid_from IS NULL OR now() >= valid_from)
    AND (valid_to IS NULL OR now() <= valid_to)
  ORDER BY week_start DESC 
  LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Check main secret code first (for winners who have it)
  IF v_normalized_code = upper(v_menu.secret_code) THEN
    RETURN true;
  END IF;
  
  -- Check daily code
  v_daily_code := get_daily_code(v_menu.week_start);
  IF v_daily_code IS NOT NULL AND v_normalized_code = upper(v_daily_code) THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;

-- Add 40+ Brittany-oriented quiz questions
INSERT INTO public.quiz_questions (question, option_a, option_b, option_c, option_d, correct_answer, category, is_active) VALUES
-- Bretagne culture & geography
('Quelle est la capitale historique de la Bretagne ?', 'Rennes', 'Nantes', 'Brest', 'Vannes', 'B', 'bretagne', true),
('Combien de départements compte la Bretagne administrative ?', '3', '4', '5', '6', 'B', 'bretagne', true),
('Quel est le point culminant de la Bretagne ?', 'Roc''h Ruz', 'Mont Saint-Michel', 'Monts d''Arrée', 'Signal de Tohannic', 'A', 'bretagne', true),
('Comment s''appelle le drapeau breton ?', 'Le Kroaz Du', 'Le Gwenn ha Du', 'Le Breizh', 'L''Hermine', 'B', 'bretagne', true),
('Quelle ville bretonne est surnommée "la cité corsaire" ?', 'Brest', 'Lorient', 'Saint-Malo', 'Concarneau', 'C', 'bretagne', true),
('Quel est l''instrument de musique traditionnel breton ?', 'La cornemuse', 'Le biniou', 'L''accordéon', 'La vielle', 'B', 'bretagne', true),
('Comment dit-on "Bretagne" en breton ?', 'Breizh', 'Brittany', 'Bretaña', 'Briton', 'A', 'bretagne', true),
('Quel célèbre festival de musique se déroule à Lorient ?', 'Les Vieilles Charrues', 'Festival Interceltique', 'Hellfest', 'Route du Rock', 'B', 'bretagne', true),
('Quelle est la plus grande île bretonne ?', 'Belle-Île-en-Mer', 'Île de Bréhat', 'Île d''Ouessant', 'Île de Groix', 'A', 'bretagne', true),
('Quel animal symbolise la Bretagne ?', 'Le lion', 'L''hermine', 'L''aigle', 'Le sanglier', 'B', 'bretagne', true),
-- Crêpes & galettes traditions
('De quelle céréale est faite la farine de sarrasin ?', 'Blé', 'Sarrasin (blé noir)', 'Seigle', 'Épeautre', 'B', 'food', true),
('Comment appelle-t-on la spatule pour retourner les crêpes ?', 'La rozell', 'La spatule', 'Le spanell', 'La tournette', 'C', 'food', true),
('Quelle est la température idéale d''un bilig ?', '150°C', '200°C', '250°C', '300°C', 'B', 'food', true),
('D''où vient le nom "galette" ?', 'Du mot "galet"', 'Du breton "gwelat"', 'Du latin "galleta"', 'Du celte "gal"', 'A', 'food', true),
('Quel ingrédient NE fait PAS partie d''une galette complète ?', 'Jambon', 'Œuf', 'Fromage', 'Champignons', 'D', 'food', true),
('Comment s''appelle le cidre très peu alcoolisé ?', 'Cidre brut', 'Cidre doux', 'Poiré', 'Chouchen', 'B', 'food', true),
('Quelle boisson au miel est typiquement bretonne ?', 'L''hydromel', 'Le chouchen', 'Le lambig', 'Le pommeau', 'B', 'food', true),
('En quelle année la crêpe est-elle apparue en Bretagne ?', 'XIIe siècle', 'XIIIe siècle', 'XIVe siècle', 'XVe siècle', 'B', 'food', true),
('Quel saint breton est patron des crêpiers ?', 'Saint Yves', 'Saint Corentin', 'Sainte Anne', 'Saint Gwénolé', 'A', 'food', true),
('Combien de temps doit reposer une pâte à crêpes ?', '30 minutes', '1 heure', '2 heures', '4 heures', 'C', 'food', true),
-- More Bretagne questions
('Quelle ville abrite le plus grand port de pêche français ?', 'Brest', 'Lorient', 'Saint-Malo', 'Concarneau', 'B', 'bretagne', true),
('Quel est le plus vieux phare de Bretagne ?', 'Phare du Créac''h', 'Phare d''Eckmühl', 'Phare de la Vieille', 'Phare du Stiff', 'D', 'bretagne', true),
('Comment s''appelle la danse traditionnelle bretonne ?', 'La gavotte', 'La bourrée', 'La farandole', 'Le rigodon', 'A', 'bretagne', true),
('Quel écrivain est né à Saint-Malo ?', 'Jules Verne', 'Chateaubriand', 'Victor Hugo', 'Émile Zola', 'B', 'bretagne', true),
('Quelle est la spécialité sucrée de Pont-Aven ?', 'Les crêpes dentelles', 'Les galettes bretonnes', 'Le kouign-amann', 'Le far breton', 'A', 'bretagne', true),
('Quel alignement mégalithique est le plus célèbre ?', 'Carnac', 'Locmariaquer', 'Erdeven', 'Monteneuf', 'A', 'bretagne', true),
('Comment dit-on "bonjour" en breton ?', 'Demat', 'Kenavo', 'Trugarez', 'Yec''hed mat', 'A', 'bretagne', true),
('Quel est le surnom de la Bretagne ?', 'La terre des marins', 'L''Armorique', 'Le pays des légendes', 'Le bout du monde', 'B', 'bretagne', true),
('Quelle est la fête traditionnelle bretonne ?', 'Le Pardon', 'La Feria', 'Le Carnaval', 'La Fête-Dieu', 'A', 'bretagne', true),
('Quel roi légendaire est associé à la forêt de Brocéliande ?', 'Charlemagne', 'Le Roi Arthur', 'Louis XIV', 'Nominoë', 'B', 'bretagne', true),
-- More food questions
('Quel beurre est typiquement breton ?', 'Beurre doux', 'Beurre demi-sel', 'Beurre clarifié', 'Beurre fondu', 'B', 'food', true),
('Qu''est-ce que le kouign-amann ?', 'Une crêpe', 'Un gâteau au beurre', 'Un biscuit', 'Une galette', 'B', 'food', true),
('Quel fruit de mer est emblématique de Cancale ?', 'Les moules', 'Les huîtres', 'Les crevettes', 'Les homards', 'B', 'food', true),
('Comment s''appelle le caramel au beurre salé breton ?', 'Salidou', 'Carabreizh', 'Breton gold', 'Karamel', 'A', 'food', true),
('Quel gâteau breton contient des pruneaux ?', 'Le kouign-amann', 'Le far breton', 'Le quatre-quarts', 'La galette', 'B', 'food', true),
('Quelle est la particularité du sel de Guérande ?', 'Il est gris', 'Il est rose', 'Il est noir', 'Il est blanc', 'A', 'food', true),
('Quel poisson fume-t-on traditionnellement en Bretagne ?', 'Le saumon', 'La sardine', 'Le maquereau', 'La truite', 'C', 'food', true),
('Comment s''appelle le pâté breton aux algues ?', 'Rillettes de la mer', 'Pâté Hénaff', 'Tartare d''algues', 'Terrine océane', 'B', 'food', true),
('Quelle pomme est utilisée pour le cidre breton ?', 'Granny Smith', 'Guillevic', 'Golden', 'Gala', 'B', 'food', true),
('Quel fromage est produit en Bretagne ?', 'Le Camembert', 'Le Curé Nantais', 'Le Roquefort', 'Le Comté', 'B', 'food', true)
ON CONFLICT DO NOTHING;

-- Deactivate old Mamers/Le Mans focused questions (keep them but inactive)
UPDATE public.quiz_questions 
SET is_active = false 
WHERE category = 'local' 
  AND (
    question ILIKE '%Mamers%' 
    OR question ILIKE '%Le Mans%'
    OR question ILIKE '%Sarthe%'
    OR question ILIKE '%Amatekoe%'
  );

-- Keep some general food questions active
UPDATE public.quiz_questions 
SET is_active = true 
WHERE category = 'food' 
  AND question NOT ILIKE '%Mamers%';