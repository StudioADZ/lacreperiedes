# Audit Click & Collect — 17 juillet 2026

La table `public.click_collect_orders` a été contrôlée dans Supabase.

Éléments validés : colonnes attendues, contraintes de statuts et de montants, index, RLS, politiques client, trigger `updated_at`, compatibilité avec `admin_audit_logs` et qualité des données.

Aucune migration SQL structurelle supplémentaire n’est requise. La correction de cette branche aligne uniquement l’authentification de l’Edge Function `admin-orders` avec les autres fonctions d’administration : JWT Supabase administrateur ou mot de passe administrateur de secours.
