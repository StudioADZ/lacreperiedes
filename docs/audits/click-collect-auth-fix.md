# Compatibilité d’authentification — admin-orders

L’Edge Function accepte désormais :

- un JWT Supabase appartenant à un utilisateur ayant le rôle `admin` ;
- le mot de passe administrateur sécurisé configuré dans `ADMIN_PASSWORD`.

La vérification fonctionne que l’identifiant soit envoyé dans l’en-tête `Authorization` ou dans le champ `adminPassword` du corps JSON.
