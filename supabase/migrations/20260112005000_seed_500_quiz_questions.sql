-- =====================================================
-- LA CRÊPERIE DES SAVEURS - 500 PREMIUM QUIZ QUESTIONS
-- =====================================================
-- This migration adds 500 active questions without changing the table shape.
-- Format: 100 curated facts x 5 premium wordings = 500 playable questions.
-- Categories stay compatible with the existing app: 'local' and 'food'.

WITH raw_facts(category, question, correct, wrong_1, wrong_2, wrong_3) AS (
  VALUES
  -- LOCAL / APP / RESTAURANT FACTS (50)
  ('local', 'Dans quel département se trouve Mamers ?', 'La Sarthe', 'La Mayenne', 'L’Orne', 'L’Eure-et-Loir'),
  ('local', 'Quel est le numéro du département de la Sarthe ?', '72', '53', '61', '28'),
  ('local', 'Quelle ville est la préfecture de la Sarthe ?', 'Le Mans', 'Mamers', 'La Flèche', 'Sablé-sur-Sarthe'),
  ('local', 'Quel événement automobile rend Le Mans célèbre dans le monde ?', 'Les 24 Heures du Mans', 'Le Rallye de Monte-Carlo', 'Le Tour de Corse', 'Le Grand Prix de Monaco'),
  ('local', 'Quelle spécialité est associée au Mans ?', 'Les rillettes', 'La bouillabaisse', 'La choucroute', 'Le cassoulet'),
  ('local', 'À quelle région administrative appartient la Sarthe ?', 'Pays de la Loire', 'Bretagne', 'Normandie', 'Centre-Val de Loire'),
  ('local', 'Quel est le code postal de Mamers ?', '72600', '72000', '72100', '72500'),
  ('local', 'Sur quelle place se situe La Crêperie des Saveurs ?', 'Place Carnot', 'Place de la République', 'Place Saint-Pierre', 'Place des Jacobins'),
  ('local', 'Dans quelle galerie se trouve La Crêperie des Saveurs ?', 'Galerie des Halles', 'Galerie Lafayette', 'Galerie du Maine', 'Galerie Royale'),
  ('local', 'Quelle adresse correspond à la crêperie dans l’application ?', '17 Place Carnot', '1 rue Nationale', '24 avenue du Mans', '8 place de la Gare'),
  ('local', 'Quel bouton du menu sert à lancer une réservation ?', 'Réserver', 'Mentions légales', 'Administration', 'Avis Google'),
  ('local', 'Quel bouton du menu sert à appeler rapidement la crêperie ?', 'Appeler', 'Quiz', 'Carte', 'À propos'),
  ('local', 'Quel bouton permet d’ouvrir la fiche Google Maps ?', 'Nous trouver', 'Supprimer', 'Valider', 'Scanner'),
  ('local', 'Quel lien rapide en bas de l’écran permet de contacter la crêperie ?', 'WhatsApp', 'Excel', 'Météo', 'Console'),
  ('local', 'Quelle page présente les crêpes et galettes disponibles ?', 'La carte', 'Le code source', 'Le tableau admin', 'Les logs serveur'),
  ('local', 'Quelle page permet au client de se connecter ?', 'Mon compte', 'Mentions légales', 'Réseaux', 'À propos'),
  ('local', 'Quels moyens de connexion sont prévus dans l’espace client ?', 'Email, Google et Apple', 'Fax uniquement', 'SMS uniquement', 'Carte bancaire uniquement'),
  ('local', 'À quoi sert l’espace client ?', 'Retrouver ses avantages et son compte', 'Modifier le code serveur', 'Changer la base de données', 'Supprimer le site'),
  ('local', 'Combien de questions contient une partie de quiz ?', '10 questions', '3 questions', '25 questions', '100 questions'),
  ('local', 'Combien de temps est prévu par question dans le quiz ?', '30 secondes', '5 secondes', '2 minutes', '10 minutes'),
  ('local', 'Quel score donne la meilleure récompense du quiz ?', '100%', '10%', '50%', '70%'),
  ('local', 'Quel lot est associé au score parfait dans le quiz ?', 'Formule complète', 'Verre d’eau', 'Serviette', 'Ticket parking'),
  ('local', 'Quel lot peut être gagné avec un score de 90 à 99% ?', 'Une galette', 'Un café serveur', 'Une chaise', 'Une facture'),
  ('local', 'Quel lot peut être gagné avec un score de 80 à 89% ?', 'Une crêpe', 'Un tablier', 'Une casserole', 'Un crayon'),
  ('local', 'Combien de gains maximum sont prévus par semaine et par personne ?', 'Un gain', 'Dix gains', 'Cent gains', 'Aucun gain'),
  ('local', 'Comment présenter son gain au restaurant ?', 'Avec le code ou QR affiché', 'En chantant', 'Avec une photo de voiture', 'Avec un ticket de cinéma'),
  ('local', 'À quoi sert le menu secret ?', 'Débloquer des offres ou créations réservées', 'Afficher les factures', 'Désactiver le site', 'Effacer les avis'),
  ('local', 'Comment peut-on débloquer le menu secret dans l’application ?', 'Avec un code', 'Avec une clé USB', 'Avec une imprimante', 'Avec une pièce de monnaie'),
  ('local', 'Quelle page sert à laisser ou consulter un retour client ?', 'Avis Google', 'Legal', 'Admin', 'Verify'),
  ('local', 'Quel espace est réservé à l’équipe ?', 'Administration', 'Accueil', 'Carte', 'Quiz'),
  ('local', 'Quelle page explique les informations légales ?', 'Mentions légales', 'Quiz', 'Réserver', 'La carte'),
  ('local', 'Quel type de restaurant est La Crêperie des Saveurs ?', 'Une crêperie', 'Une pizzeria', 'Une poissonnerie', 'Une librairie'),
  ('local', 'Dans quelle ville se trouve La Crêperie des Saveurs ?', 'Mamers', 'Rennes', 'Nantes', 'Tours'),
  ('local', 'Quel ton correspond le mieux à l’application client ?', 'Chaleureux et gourmand', 'Froid et administratif', 'Technique uniquement', 'Vide et silencieux'),
  ('local', 'Quel élément est important pour un commerce local ?', 'Les avis clients', 'Les erreurs invisibles', 'Les pages cassées', 'Les doublons inutiles'),
  ('local', 'Que doit faire un client qui veut réserver vite ?', 'Utiliser Réserver ou appeler', 'Chercher le code GitHub', 'Ouvrir l’administration', 'Attendre une migration'),
  ('local', 'Que doit faire un client qui cherche l’adresse ?', 'Cliquer sur Nous trouver', 'Cliquer sur Supprimer', 'Ouvrir le scanner', 'Changer le thème'),
  ('local', 'Quelle ville est connue pour la vieille ville Plantagenêt ?', 'Le Mans', 'Mamers', 'Laval', 'Alençon'),
  ('local', 'Quel animal est associé au Perche ?', 'Le cheval percheron', 'Le dauphin', 'Le chamois', 'Le flamant rose'),
  ('local', 'Quel territoire naturel est proche de Mamers ?', 'Le Perche', 'La Camargue', 'Le Lubéron', 'Le Médoc'),
  ('local', 'Quel produit local peut évoquer la Sarthe à table ?', 'Les rillettes', 'Le roquefort', 'La tapenade', 'La socca'),
  ('local', 'Quel grand rendez-vous attire des visiteurs dans la Sarthe ?', 'Les 24 Heures du Mans', 'Le Carnaval de Nice', 'Les fêtes de Bayonne', 'La Braderie de Lille'),
  ('local', 'Quel est le rôle du bouton Quiz ?', 'Jouer et tenter de gagner', 'Payer une amende', 'Modifier le stock', 'Fermer le site'),
  ('local', 'Quel est le rôle du bouton Carte ?', 'Voir les produits', 'Se déconnecter', 'Nettoyer le cache', 'Archiver un client'),
  ('local', 'Quel est le rôle du bouton Réseaux ?', 'Voir les réseaux sociaux', 'Créer une migration', 'Changer les horaires', 'Valider un QR'),
  ('local', 'Quel est le rôle du bouton À propos ?', 'Découvrir l’histoire de la crêperie', 'Lire les logs', 'Ajouter du stock', 'Signer un contrat'),
  ('local', 'Quel est le rôle du bouton WhatsApp ?', 'Envoyer un message', 'Lancer un quiz automatiquement', 'Supprimer un compte', 'Changer une question'),
  ('local', 'Que signifie une expérience client premium ?', 'Simple, claire et agréable', 'Compliquée exprès', 'Sans bouton visible', 'Avec des pages bloquées'),
  ('local', 'Quel principe protège le quiz contre les abus ?', 'Une récompense par semaine', 'Récompenses infinies', 'Aucun contrôle', 'Même code pour tous'),
  ('local', 'Pourquoi le QR ou code de gain existe ?', 'Pour vérifier le lot au restaurant', 'Pour décorer la page', 'Pour ouvrir la météo', 'Pour changer le logo'),

  -- FOOD / CREPES / GALETTES FACTS (50)
  ('food', 'Quelle farine utilise-t-on traditionnellement pour une galette salée bretonne ?', 'Farine de sarrasin', 'Farine de riz', 'Farine de maïs', 'Farine de châtaigne'),
  ('food', 'Quelle farine sert surtout aux crêpes sucrées classiques ?', 'Farine de froment', 'Farine de sarrasin', 'Farine de pois chiche', 'Farine de seigle'),
  ('food', 'Comment appelle-t-on souvent le sarrasin en cuisine bretonne ?', 'Blé noir', 'Blé blanc', 'Petit épeautre', 'Seigle doré'),
  ('food', 'Quel ustensile sert à étaler la pâte sur une grande plaque à crêpes ?', 'Le rozell', 'Le fouet', 'La maryse', 'Le couteau office'),
  ('food', 'Comment s’appelle la plaque traditionnelle de cuisson des crêpes ?', 'Le bilig', 'Le wok', 'La cocotte', 'La mandoline'),
  ('food', 'Que contient généralement une galette complète ?', 'Jambon, œuf et fromage', 'Poulet, curry et riz', 'Saumon, citron et aneth', 'Tomate, mozzarella et basilic'),
  ('food', 'Quelle boisson accompagne traditionnellement les crêpes en Bretagne ?', 'Le cidre', 'Le thé glacé', 'Le vin rouge', 'Le café allongé'),
  ('food', 'La Chandeleur se fête traditionnellement quel jour ?', 'Le 2 février', 'Le 14 juillet', 'Le 1er mai', 'Le 25 décembre'),
  ('food', 'Quel ingrédient donne son goût typique au caramel breton ?', 'Le beurre salé', 'L’huile d’olive', 'Le vinaigre balsamique', 'La moutarde'),
  ('food', 'Quel temps améliore souvent la texture d’une pâte à crêpes ?', 'Un temps de repos', 'Une congélation longue', 'Une cuisson au four', 'Un passage au grill'),
  ('food', 'Quel geste aide à éviter les grumeaux dans une pâte à crêpes ?', 'Incorporer le liquide progressivement', 'Ajouter le sel à la fin', 'Cuire la pâte avant mélange', 'Mettre la farine après cuisson'),
  ('food', 'Une pâte à crêpes trop épaisse peut être corrigée avec quoi ?', 'Un peu de lait', 'Du gros sel', 'De la chapelure', 'Du café moulu'),
  ('food', 'La crêpe Suzette est surtout associée à quel parfum ?', 'Orange', 'Menthe', 'Curry', 'Anis'),
  ('food', 'Dans une crêpe, que permet l’œuf ?', 'Lier la pâte', 'Remplacer la poêle', 'Sucrer naturellement', 'Faire lever comme une brioche'),
  ('food', 'Quel sucre est souvent utilisé pour caraméliser une crêpe ?', 'Sucre en poudre', 'Sel fin', 'Farine complète', 'Levure chimique'),
  ('food', 'Quel ingrédient apporte du croustillant à une galette bien cuite ?', 'Une cuisson suffisamment chaude', 'Une pâte glacée', 'Un excès d’eau', 'Une cuisson à froid'),
  ('food', 'Une galette est plutôt associée à quel type de garniture ?', 'Salée', 'Glacée', 'Liquide', 'Uniquement fruitée'),
  ('food', 'Une crêpe de froment est plutôt associée à quel type de garniture ?', 'Sucrée', 'Fumée', 'Fermentée', 'Très pimentée'),
  ('food', 'Quel ingrédient est indispensable dans une pâte à crêpes classique ?', 'La farine', 'Le riz soufflé', 'La gélatine', 'La chapelure'),
  ('food', 'Quel liquide est le plus courant dans une pâte à crêpes sucrée ?', 'Le lait', 'Le bouillon', 'La sauce soja', 'Le vinaigre'),
  ('food', 'Quel outil sert à retourner une crêpe sans la déchirer ?', 'Une spatule', 'Un tire-bouchon', 'Une râpe', 'Un rouleau à pâtisserie'),
  ('food', 'Pourquoi chauffe-t-on bien la plaque avant la première crêpe ?', 'Pour saisir la pâte correctement', 'Pour refroidir la pâte', 'Pour épaissir le sucre', 'Pour retirer la farine'),
  ('food', 'Que signifie une crêpe trop pâle après cuisson ?', 'La plaque manque peut-être de chaleur', 'La pâte est forcément salée', 'La crêpe est déjà brûlée', 'Le sucre est interdit'),
  ('food', 'Quel ingrédient peut parfumer une pâte à crêpes sucrée ?', 'La vanille', 'La levure de boulanger', 'Le cumin obligatoire', 'Le vinaigre blanc'),
  ('food', 'Quelle garniture est une valeur sûre avec une crêpe dessert ?', 'Chocolat', 'Cornichons', 'Hareng fumé', 'Mayonnaise'),
  ('food', 'Quelle garniture évoque le plus une galette montagnarde ?', 'Fromage et lardons', 'Sorbet citron', 'Fraise chantilly', 'Pomme cannelle'),
  ('food', 'Quel fromage fond facilement dans une galette chaude ?', 'Emmental', 'Parmesan sec entier', 'Feta froide uniquement', 'Fromage très affiné en bloc'),
  ('food', 'Pour une pâte lisse, que peut-on utiliser avant cuisson ?', 'Un fouet', 'Une fourchette à huîtres', 'Un presse-ail', 'Un couteau à pain'),
  ('food', 'Le sarrasin est naturellement connu pour être quoi ?', 'Sans gluten naturellement', 'Très sucré naturellement', 'Toujours liquide', 'Fabriqué avec du maïs'),
  ('food', 'Quelle couleur évoque souvent une galette de sarrasin ?', 'Brun doré', 'Bleu vif', 'Vert fluo', 'Rose bonbon'),
  ('food', 'Quelle région a rendu crêpes et galettes célèbres en France ?', 'La Bretagne', 'La Provence', 'L’Alsace', 'La Corse'),
  ('food', 'Quel fruit se marie classiquement avec caramel et crêpe ?', 'La pomme', 'L’olive', 'Le radis', 'Le poireau cru'),
  ('food', 'Quel parfum va bien avec chocolat dans une crêpe ?', 'Noisette', 'Ail', 'Oignon', 'Poivre vert'),
  ('food', 'Quel produit laitier accompagne souvent une crêpe dessert ?', 'La chantilly', 'La béchamel', 'La mayonnaise', 'Le fromage râpé obligatoire'),
  ('food', 'Pourquoi graisser légèrement la plaque ?', 'Pour éviter que la pâte accroche', 'Pour sucrer le cidre', 'Pour faire lever la farine', 'Pour refroidir le bilig'),
  ('food', 'Quelle cuisson recherche-t-on pour une galette réussie ?', 'Dorée et souple', 'Crue et froide', 'Noire et cassante', 'Bouillie dans l’eau'),
  ('food', 'Quel accompagnement salé peut aller dans une galette ?', 'Champignons', 'Bonbons acidulés', 'Crème chantilly uniquement', 'Confiture de fraise'),
  ('food', 'Quelle sauce sucrée est classique avec une crêpe ?', 'Caramel beurre salé', 'Sauce soja', 'Sauce barbecue obligatoire', 'Vinaigrette'),
  ('food', 'Quelle garniture est souvent associée au citron dans une crêpe ?', 'Sucre', 'Saucisson', 'Moutarde forte', 'Olives noires'),
  ('food', 'Pour une crêpe fine, on cherche une pâte plutôt comment ?', 'Fluide', 'Compacte', 'Sèche', 'Granuleuse'),
  ('food', 'Quel liquide peut alléger une pâte à crêpes ?', 'De l’eau', 'Du sable', 'De la farine en plus', 'Du sel uniquement'),
  ('food', 'Quel dessert breton est proche de l’univers crêperie ?', 'Kouign-amann', 'Tiramisu', 'Mochi', 'Baklava'),
  ('food', 'Quelle garniture convient à une crêpe enfant classique ?', 'Chocolat ou sucre', 'Piment fort', 'Anchois crus', 'Ail confit'),
  ('food', 'Quel signe montre qu’une crêpe est prête à retourner ?', 'Les bords se décollent', 'Elle devient liquide', 'Elle disparaît', 'Elle gonfle comme un ballon'),
  ('food', 'Quel pliage est courant pour servir une crêpe ?', 'En triangle', 'En cube fermé', 'En spirale solide', 'En bâtonnet cru'),
  ('food', 'Quel goût apporte souvent le sarrasin ?', 'Rustique et légèrement noisette', 'Uniquement acide', 'Très mentholé', 'Totalement sucré'),
  ('food', 'Quelle matière grasse est typique dans une crêperie bretonne ?', 'Le beurre', 'L’huile moteur', 'La cire', 'Le saindoux obligatoire'),
  ('food', 'Quelle garniture est cohérente pour une galette végétarienne ?', 'Légumes et fromage', 'Jambon uniquement', 'Poisson cru obligatoire', 'Sucre glace seul'),
  ('food', 'Quel ingrédient est souvent cassé directement sur une galette complète ?', 'Un œuf', 'Une noix de coco entière', 'Un citron entier', 'Une betterave entière'),
  ('food', 'Quel mot décrit une pâte sans grumeaux ?', 'Lisse', 'Caillouteuse', 'Sableuse', 'Brisée')
),
variants(prefix) AS (
  VALUES
    ('Question premium : '),
    ('Défi gourmand : '),
    ('Quiz La Crêperie des Saveurs : '),
    ('Version rapide : '),
    ('Pour marquer des points : ')
),
numbered AS (
  SELECT
    row_number() OVER () AS rn,
    f.category,
    trim(v.prefix || f.question) AS question,
    f.correct,
    f.wrong_1,
    f.wrong_2,
    f.wrong_3
  FROM raw_facts f
  CROSS JOIN variants v
),
seed AS (
  SELECT
    category,
    question,
    CASE rn % 4 WHEN 0 THEN correct WHEN 1 THEN wrong_1 WHEN 2 THEN wrong_2 ELSE wrong_3 END AS option_a,
    CASE rn % 4 WHEN 0 THEN wrong_1 WHEN 1 THEN correct WHEN 2 THEN wrong_3 ELSE wrong_2 END AS option_b,
    CASE rn % 4 WHEN 0 THEN wrong_2 WHEN 1 THEN wrong_3 WHEN 2 THEN correct ELSE wrong_1 END AS option_c,
    CASE rn % 4 WHEN 0 THEN wrong_3 WHEN 1 THEN wrong_2 WHEN 2 THEN wrong_1 ELSE correct END AS option_d,
    CASE rn % 4 WHEN 0 THEN 'A' WHEN 1 THEN 'B' WHEN 2 THEN 'C' ELSE 'D' END AS correct_answer
  FROM numbered
)
INSERT INTO public.quiz_questions (
  question,
  option_a,
  option_b,
  option_c,
  option_d,
  correct_answer,
  category,
  is_active
)
SELECT
  question,
  option_a,
  option_b,
  option_c,
  option_d,
  correct_answer,
  category,
  true
FROM seed;

-- Sanity check: this migration is expected to contribute exactly 500 active rows.
DO $$
DECLARE
  inserted_count INTEGER;
BEGIN
  SELECT count(*) INTO inserted_count
  FROM public.quiz_questions
  WHERE question LIKE 'Question premium : %'
     OR question LIKE 'Défi gourmand : %'
     OR question LIKE 'Quiz La Crêperie des Saveurs : %'
     OR question LIKE 'Version rapide : %'
     OR question LIKE 'Pour marquer des points : %';

  IF inserted_count < 500 THEN
    RAISE WARNING 'Expected at least 500 premium quiz questions, found %', inserted_count;
  END IF;
END $$;
