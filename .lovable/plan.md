# Audit Edge Functions — lecture seule

## 1. Emplacement du code source

Toutes les Edge Functions vivent dans `supabase/functions/` à la racine du projet :

```
supabase/functions/
├── _shared/               (utilitaires partagés : validation.ts)
├── admin-scan/index.ts
├── admin-social-posts/index.ts
├── quiz-session/index.ts
├── quiz-submit/index.ts
├── secret-menu-save/index.ts
├── send-prize-email/index.ts
├── verify-prize/index.ts
└── weekly-health-check/index.ts
```

Toutes les 7 fonctions demandées sont bien présentes dans le repo, plus `weekly-health-check`.

## 2. Incohérence critique de project ref

Il existe **deux project refs Supabase différents** dans le projet :

| Source | Project ref | Rôle |
|---|---|---|
| `.env` → `VITE_SUPABASE_PROJECT_ID` + `VITE_SUPABASE_URL` | **`gwpycfojyekjjddzpqil`** | Utilisé **réellement par l'application** (client web via `src/integrations/supabase/client.ts`) |
| `supabase/config.toml` → `project_id` | **`kdpdwyrwijrphmlcrecg`** | Cible historique du CLI Supabase local |
| `.github/workflows/supabase-deploy.yml` | `${{ secrets.SUPABASE_PROJECT_ID }}` | Cible du déploiement GitHub Actions (valeur inconnue depuis le repo) |

**Le project ref réellement utilisé par l'app est `gwpycfojyekjjddzpqil`** (c'est celui vers lequel le frontend envoie toutes ses requêtes REST + Edge Functions).

Le `config.toml` pointe vers un **autre projet** (`kdpdwyrwijrphmlcrecg`), qui semble être un ancien projet Supabase orphelin ou un projet local.

## 3. Statut de déploiement réel

L'app tourne (quiz, admin, etc. fonctionnent d'après le contexte) → les fonctions **sont bien déployées** sur `gwpycfojyekjjddzpqil` par le pipeline Lovable Cloud (qui déploie automatiquement toute fonction présente dans `supabase/functions/` vers le backend Cloud lié à l'app, indépendamment de `config.toml`).

Note : `admin-social-posts` et `send-prize-email` **ne sont pas listées** dans le workflow GitHub Actions `supabase-deploy.yml` ; elles sont donc déployées uniquement par le pipeline Lovable Cloud, pas par le CI GitHub.

## 4. Pourquoi elles n'apparaissent pas dans "votre" dashboard Supabase

Parce que le dashboard Supabase que vous regardez correspond très probablement au projet `kdpdwyrwijrphmlcrecg` (celui de `config.toml`), alors que les fonctions sont déployées sur **`gwpycfojyekjjddzpqil`** (Lovable Cloud).

Deux facteurs se combinent :
1. **Lovable Cloud gère un backend Supabase interne** (`gwpycfojyekjjddzpqil`) qui n'apparaît **pas** dans votre compte supabase.com personnel — c'est un projet géré par Lovable, non accessible via le dashboard Supabase standard.
2. Si vous ouvrez le projet `kdpdwyrwijrphmlcrecg` sur supabase.com, vous verrez peut-être des fonctions plus anciennes ou aucune, car ce projet n'est pas celui que l'app utilise.

## 5. Comment retrouver / redéployer

### Pour voir les fonctions actuellement en service
- **Dashboard Lovable** → bouton **View Backend** (celui présenté dans l'UI Lovable). C'est la seule vue autorisée sur le projet `gwpycfojyekjjddzpqil`.
- Le dashboard supabase.com public **n'est pas accessible** pour un projet Lovable Cloud managé.

### Pour redéployer via Lovable
Toute modification d'un fichier dans `supabase/functions/<name>/index.ts` déclenche un redéploiement automatique par Lovable Cloud. Pas de commande manuelle nécessaire.

### Pour redéployer via CLI Supabase (si vous voulez vraiment cibler un projet externe)
```bash
supabase link --project-ref gwpycfojyekjjddzpqil
supabase functions deploy admin-scan admin-social-posts quiz-session \
  quiz-submit verify-prize send-prize-email secret-menu-save \
  --project-ref gwpycfojyekjjddzpqil
```
⚠️ Cela nécessite `SUPABASE_ACCESS_TOKEN` valide **et** que le projet Cloud accepte le lien externe (généralement non pour un projet Lovable Cloud managé).

### Pour le pipeline GitHub Actions
Le workflow `.github/workflows/supabase-deploy.yml` utilise `secrets.SUPABASE_PROJECT_ID`. Vérifier dans GitHub → Settings → Secrets la valeur réellement configurée (probablement `kdpdwyrwijrphmlcrecg`, ce qui expliquerait que ce CI déploie sur le mauvais projet).

## 6. Points d'attention (sans modification)

- `config.toml` incohérent avec `.env` → source de confusion majeure.
- Workflow GitHub Actions incomplet (manque `admin-social-posts` et `send-prize-email`) et cible potentiellement un autre projet.
- Aucune action corrective n'est appliquée dans cet audit.

## Résumé exécutif

- **Project ref utilisé par l'app** : `gwpycfojyekjjddzpqil` (Lovable Cloud managé).
- **Project ref dans `config.toml`** : `kdpdwyrwijrphmlcrecg` (orphelin / autre projet).
- **Les fonctions sont déployées** sur le premier, invisibles depuis un dashboard supabase.com personnel car géré par Lovable → passer par **View Backend** dans Lovable.
