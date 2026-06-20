# Citadel

Gestionnaire de collection LEGO — suivi d'inventaire, prix de marché, et export.

## Stack

- **Nuxt 4** + Vue 3.5 (Composition API)
- **Drizzle ORM** + PostgreSQL 17
- **Pinia** (state management)
- **Tailwind CSS** + Chart.js
- **Traefik** + **Authentik** (reverse proxy + SSO via forward auth)
- **PWA** (installable, service worker)

## Architecture

```
citadel-app     → Nuxt SSR, port 3000, derrière Traefik
citadel-worker  → Cron de rafraîchissement des prix (BrickLink API)
citadel-db      → PostgreSQL 17, réseau interne uniquement
```

L'authentification est déléguée à Authentik via les headers `x-authentik-*` injectés par Traefik. L'app ne gère pas de session propre.

## Prérequis

- Docker + Docker Compose
- Un réseau Docker externe `traefik_proxy` existant
- Un fichier `.env` (voir `.env.example`)

## Variables d'environnement

| Variable                    | Description                              |
| --------------------------- | ---------------------------------------- |
| `POSTGRES_PASSWORD`         | Mot de passe PostgreSQL                  |
| `BRICKLINK_CONSUMER_KEY`    | OAuth 1.0a BrickLink                     |
| `BRICKLINK_CONSUMER_SECRET` | OAuth 1.0a BrickLink                     |
| `BRICKLINK_TOKEN`           | OAuth 1.0a BrickLink                     |
| `BRICKLINK_TOKEN_SECRET`    | OAuth 1.0a BrickLink                     |
| `REBRICKABLE_API_KEY`       | Clé API Rebrickable                      |
| `CRON_SCHEDULE`             | Schedule du worker (défaut: `0 4 * * *`) |

## Développement

```bash
pnpm install
pnpm dev          # Nuxt dev server
pnpm db:studio    # Drizzle Studio (UI base de données)
pnpm typecheck    # Vérification TypeScript
pnpm lint         # ESLint
```

## Base de données

```bash
pnpm db:generate  # Générer une migration depuis le schéma
pnpm db:migrate   # Appliquer les migrations
```

Schéma : `server/db/schema.ts`

## Production

```bash
cp .env.example .env   # Remplir les variables
docker compose up -d
```

Déployer (NAS) :

```bash
ssh generalramda@192.168.1.29
sudo bash /volume4/docker/nas-docker/citadel/deploy.sh
```

Les migrations sont appliquées automatiquement au démarrage via le bundle worker.

## Worker

Rafraîchit les prix depuis BrickLink et Rebrickable selon `CRON_SCHEDULE`.  
Tourne dans `citadel-worker`, isolé sur le réseau interne.

Lancer manuellement en prod (exécution immédiate) :

```bash
sudo docker exec -e CRON_SCHEDULE="* * * * *" citadel-worker node /app/.output/worker.mjs
```

## Export

Dashboard → export Excel des listings prix via `/api/export`.
