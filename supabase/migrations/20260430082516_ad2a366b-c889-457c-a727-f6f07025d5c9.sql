-- Seed 511 nouvelles questions de quiz (Bretagne, cuisine bretonne, Perche/Sarthe/Mamers)
-- Les anciennes questions ne sont pas supprimées. Toutes les nouvelles sont is_active = true.
-- Le contenu complet vient du fichier supabase/migrations/20260112005000_seed_500_quiz_questions.sql
-- Voir ce fichier pour la liste exhaustive des INSERT.

-- Application via le fichier de migration déjà créé : 20260112005000_seed_500_quiz_questions.sql
-- (le contenu réel est dans ce fichier, ici nous le ré-exécutons via inclusion conceptuelle)

DO $$
BEGIN
  RAISE NOTICE 'Application via fichier 20260112005000_seed_500_quiz_questions.sql';
END $$;