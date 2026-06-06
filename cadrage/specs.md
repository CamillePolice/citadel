# Citadel — Spécification produit & technique

|                    |                                                                    |
| ------------------ | ------------------------------------------------------------------ |
| **Version**        | 1.0 — spécification pour développement                             |
| **Statut**         | Validée, prête à implémenter                                       |
| **Domaine**        | `citadel.camillepolice.com`                                        |
| **Hébergement**    | Self-hosted (homelab Scarif), Docker, derrière Traefik + Authentik |
| **Source de prix** | BrickLink (référence) + Brick Owl (secondaire)                     |

---

## 1. Contexte & vision

### 1.1 Le problème

Un collectionneur LEGO accumule deux types de sets : des **boîtes neuves scellées** (souvent achetées comme placement, car les sets retirés du catalogue prennent de la valeur avec le temps) et des **sets d'occasion** déjà montés ou remontés. Au-delà de quelques dizaines de références, deux besoins apparaissent :

- **Inventorier une fois** une collection qui finit stockée, emballée, hors de portée visuelle.
- **Suivre la valeur de marché dans le temps** sans devoir re-chercher manuellement chaque référence sur les marketplaces.

Aujourd'hui, ce suivi se fait à la main (tableurs recopiés, recherches répétées sur BrickLink/comparateurs). C'est fastidieux, vite obsolète, et incapable de montrer une **évolution** ou une **plus-value**.

### 1.2 Le produit

**Citadel** est une application web self-hosted qui traite une collection LEGO comme un **portefeuille d'actifs**. Chaque utilisateur :

1. saisit sa librairie de sets (manuellement, une fois), en distinguant neuf scellé et occasion ;
2. laisse l'application récupérer et historiser automatiquement les prix de marché (quotidien) ;
3. consulte un **dashboard** par utilisateur avec des indicateurs de valeur, de performance et de répartition ;
4. peut **exporter un Excel** comme livrable / archivage.

Le nom fait référence à la **Citadelle de Scarif** (Star Wars), le coffre-fort d'archives impérial où sont stockés les plans les plus précieux — métaphore directe d'un inventaire qui archive et valorise une collection mise sous scellé.

### 1.3 Public et déploiement

Démarrage en **instance privée** (le propriétaire + un proche), mais l'architecture doit permettre d'**ouvrir l'accès au pool d'utilisateurs SSO** existant (Authentik) sans refonte ni redéploiement (cf. §7). L'application est hébergée sur le NAS « Scarif », derrière le reverse proxy Traefik et l'IdP Authentik déjà en place.

---

## 2. Glossaire métier

| Terme                          | Définition                                                                            |
| ------------------------------ | ------------------------------------------------------------------------------------- |
| **Set**                        | Un produit LEGO identifié par un numéro (ex. `75281`), normalisé en `75281-1`         |
| **Scellé / neuf (new sealed)** | Boîte d'origine non ouverte ; marché et valorisation distincts de l'occasion          |
| **Occasion (used)**            | Set monté/démonté, complet ou non ; valeur dépendante de la complétude                |
| **Complétude**                 | Présence des pièces, de la boîte, de la notice, des minifigs                          |
| **Minifig**                    | Figurine LEGO ; impacte fortement la valeur d'occasion                                |
| **Retraite (retired / EOL)**   | Set arrêté par LEGO ; généralement déclencheur d'appréciation du scellé               |
| **Price Guide**                | Données de prix agrégées d'une marketplace pour un item donné                         |
| **`sold` (BrickLink)**         | Guide basé sur les **ventes réelles** des 6 derniers mois (moyenne glissante, stable) |
| **`stock` (BrickLink)**        | Guide basé sur les **annonces en cours** (prix demandés, plus volatils)               |
| **BOID**                       | Identifiant catalogue interne à Brick Owl                                             |
| **Base de coût (cost basis)**  | Prix d'achat servant au calcul de plus-value                                          |
| **Plus-value latente**         | Valeur de marché actuelle − base de coût, non réalisée (pas de vente)                 |

---

## 3. Objectifs & périmètre

### 3.1 Objectifs

- Inventaire saisi **une seule fois**, suivi de valeur **sans recherche manuelle**.
- Distinction nette **marché scellé** vs **marché occasion** sur les mêmes données.
- **Dashboard par utilisateur** avec indicateurs façon suivi d'actif.
- **Export Excel** comme livrable final.
- Architecture **multi-utilisateur scalable** sur le pool SSO, sans surcoût opérationnel notable.

### 3.2 Dans le périmètre (v1 / MVP)

- Comptes via SSO (Authentik), provisioning automatique.
- Saisie manuelle de sets + enrichissement automatique des métadonnées.
- Rafraîchissement quotidien des prix (BrickLink + Brick Owl).
- Dashboard, indicateurs essentiels, courbe d'évolution.
- Export Excel.

### 3.3 Hors périmètre (v1) — candidats v2+

- Multi-devise (EUR uniquement en v1).
- Saisie par scan code-barres / OCR de boîte.
- Partage public de collection, marketplace, alertes push.
- Valorisation fine des sets incomplets (limite assumée, cf. §10.4).
- Intégration de comparateurs retail (ex. Avenue de la brique) : pas d'API, scraping écarté.

---

## 4. Personas & user stories

**Persona A — Le collectionneur-investisseur.** Possède de nombreux sets scellés stockés. Veut suivre la plus-value et repérer les sets qui partent en retraite.

**Persona B — Le joueur.** A surtout de l'occasion. Veut une estimation indicative de la valeur de sa collection.

User stories clés :

- _En tant qu'utilisateur, je me connecte via le SSO sans créer de compte dédié._
- _…je saisis un set par son numéro et l'app remplit nom, thème, année, pièces, image automatiquement._
- _…je précise pour chaque set sa condition, sa complétude, mon prix et ma date d'achat, et où il est stocké._
- _…je vois la valeur totale de ma collection et son évolution dans le temps._
- _…je repère mes meilleures et pires performances._
- _…j'exporte un Excel de ma collection avec les valeurs courantes._

---

## 5. Exigences fonctionnelles

### 5.1 Comptes & accès

Authentification déléguée à **Authentik** via **Traefik forward auth** : l'application ne porte aucun écran de login ni gestion de token. Traefik route chaque requête vers l'outpost Authentik ; une session non authentifiée est redirigée vers l'IdP, et au retour l'outpost injecte des en-têtes de confiance (`X-authentik-uid`, `X-authentik-email`, `X-authentik-username`, `X-authentik-groups`). Le serveur lit `X-authentik-uid` pour identifier l'utilisateur (détails §7).

### 5.2 Ajout d'un set (saisie manuelle)

1. L'utilisateur saisit un **numéro de set** (`75281` → normalisé `75281-1`).
2. Le back enrichit automatiquement les métadonnées via le catalogue (nom, thème, sous-thème, année, nb de pièces, image) — récupéré une fois et mutualisé entre utilisateurs.
3. L'utilisateur complète les attributs de **possession** :
   - condition : `neuf_scellé` | `occasion`
   - quantité
   - complétude (si occasion) : `complet` | `incomplet`, présence boîte / notice / minifigs
   - prix d'achat + date d'achat (base de coût)
   - emplacement de stockage (label du carton)
   - notes libres
4. Édition / suppression ultérieures d'un item.

### 5.3 Dashboard

Vue d'ensemble par utilisateur (cf. §6) : KPIs en cartes, courbe d'évolution de la valeur, répartitions (par thème, neuf/occasion), table triable de la librairie avec valeur courante et plus-value par ligne. Tous les graphes sont rendus avec **Chart.js** : courbe d'évolution → _line chart_ ; répartitions thème et neuf/occasion → _doughnut_ ; top performers / flops → _bar chart horizontal_.

### 5.4 Détail d'un set

Historique de prix (courbe), prix d'achat vs valeur actuelle, fourchette min/moy/max, indication de la source de prix utilisée, lien vers la marketplace.

### 5.5 Export Excel

Génération à la demande d'un `.xlsx` (cf. §11) reflétant la librairie + valeurs courantes + historique + synthèse.

---

## 6. Indicateurs (KPIs)

La collection est traitée comme un **portefeuille d'actifs**. Le prix de référence d'un item = price guide **selon sa condition** (neuf → guide neuf, occasion → guide occasion), variante `sold` (ventes réelles 6 mois, plus stable que les annonces).

> **Note de conception graphique** : le guide `sold` est une **moyenne glissante sur 6 mois** ; les snapshots quotidiens évoluent lentement. Les fenêtres de variation pertinentes sont **30 / 90 jours**, pas le jour-le-jour.

### 6.1 Essentiels (v1)

| Indicateur                       | Définition                                   | Intérêt                         |
| -------------------------------- | -------------------------------------------- | ------------------------------- |
| **Valeur de marché totale**      | Σ (prix courant condition × quantité)        | L'information n°1               |
| **Coût d'acquisition total**     | Σ (prix d'achat × quantité)                  | Base de comparaison             |
| **Plus/moins-value latente**     | Valeur − Coût, en € **et** en %              | Résultat « investisseur »       |
| **ROI global**                   | (Valeur − Coût) / Coût                       | Comparable entre collections    |
| **Évolution de la valeur**       | Courbe de la valeur totale agrégée par jour  | Cœur du besoin                  |
| **Top performers / flops**       | Classement des sets par % de plus-value      | Décision garder / revendre      |
| **Répartition par thème**        | Part de valeur par thème                     | Diversification / concentration |
| **Répartition neuf vs occasion** | Part de valeur par condition                 | Profil de la collection         |
| **Synthèse**                     | Nb de sets, nb de pièces, valeur moyenne/set | Repères de taille               |

### 6.2 Avancés (v2)

| Indicateur                     | Définition                                      | Intérêt                                           |
| ------------------------------ | ----------------------------------------------- | ------------------------------------------------- |
| **Statut retraite LEGO**       | Flag _retired/EOL_ + date                       | Signal de valorisation le plus fort sur le scellé |
| **Variation 30j / 90j**        | Δ% de valeur (portefeuille + par set)           | Momentum sans le bruit quotidien                  |
| **Rendement annualisé (CAGR)** | Par set, depuis la date d'achat                 | Comparer des durées de détention différentes      |
| **Indice de concentration**    | Part du top set / top 5 dans la valeur          | Détecter une dépendance excessive                 |
| **Meilleures affaires**        | Plus gros écart achat → valeur actuelle         | Mettre en avant les bons achats                   |
| **Alertes**                    | Seuil atteint, passage en retraite, pic de prix | Proactivité                                       |

Écartés volontairement : volatilité/écart-type et ratios type Sharpe (peu de sens sur une moyenne 6 mois, sur-ingénierie pour l'usage).

---

## 7. Authentification, accès & scaling SSO

### 7.1 Mécanisme

Authentik (proxy provider, mode _forward auth single application_) + middleware Traefik `forwardAuth` pointant sur l'outpost (`/outpost.goauthentik.io/auth/traefik`). En-têtes de confiance injectés : `X-authentik-uid`, `-email`, `-username`, `-groups`. Le serveur applicatif lit `X-authentik-uid` comme identifiant stable.

### 7.2 Provisioning just-in-time (JIT)

Aucun écran d'inscription. À la première requête authentifiée d'un `X-authentik-uid` inconnu, le middleware crée la ligne `users` à la volée (uid, email, username depuis les en-têtes). Les connexions suivantes rattachent la même ligne.

### 7.3 Contrôle d'accès & extensibilité

L'application **ne contient aucune allow-list** d'utilisateurs. Qui peut entrer = qui Authentik laisse passer, via le binding de l'application Citadel à un ou plusieurs **groupes Authentik**. Conséquences :

- Ouvrir l'accès à un membre du pool SSO = l'ajouter au groupe côté IdP. **Zéro déploiement, zéro modification de code.**
- Le rôle `admin` est dérivé d'un groupe Authentik (`X-authentik-groups`, ex. `citadel-admins`), jamais d'un flag stocké en base.

### 7.4 Sécurité des en-têtes (critique)

Les en-têtes `X-authentik-*` sont **dignes de confiance uniquement parce que** l'application n'est joignable que via Traefik. Exigences :

- Le conteneur applicatif n'expose **aucun port** ; il n'est accessible que par le réseau Traefik.
- La middleware forwardAuth doit supprimer / écraser tout en-tête `X-authentik-*` provenant du client (sinon usurpation d'identité). Le plugin Traefik dédié à Authentik gère ce strip ; avec la middleware native, déclarer explicitement les `authResponseHeaders`.
- Note de version : depuis Authentik 2025.12.5 / 2026.2.3, l'en-tête `X-Original-Uri` est remplacé par `X-Original-Url` (à garder à jour si le plugin communautaire est utilisé).

### 7.5 Alternative

Si une portabilité hors homelab devient nécessaire, Authentik peut être utilisé en **provider OIDC** avec code flow géré côté serveur (sessions applicatives). Pour l'usage privé derrière Traefik, le forward auth reste plus simple et sans code d'auth.

---

## 8. Architecture

```
                 ┌───────────────────────────────┐
   Utilisateur ─▶│  Traefik (reverse proxy)       │
                 │  + forwardAuth ─▶ Authentik     │
                 └───────────────┬─────────────────┘
                                 │  en-têtes X-authentik-* de confiance
                                 ▼
┌─────────────┐     ┌───────────────────────────┐     ┌─────────────┐
│  Nuxt 4 SPA │────▶│  Nitro server (BFF)        │────▶│ PostgreSQL  │
│  (dashboard)│     │  lit X-authentik-uid       │     │  + Drizzle  │
└─────────────┘     └───────────────────────────┘     └─────────────┘
                                                              ▲
                                                       ┌──────┴────────┐
                                                       │ Pricing Worker │  (cron quotidien)
                                                       │ BrickLink +    │
                                                       │ Brick Owl +    │
                                                       │ Rebrickable    │
                                                       └────────────────┘
```

- **Frontend** : Nuxt 4 (Vue 3, composition API, Pinia). Graphes du dashboard via **Chart.js** (wrapper `vue-chartjs` pour l'intégration Vue 3).
- **Backend applicatif** : Nitro server routes (BFF). Identité de confiance lue dans `X-authentik-uid`, accès Drizzle. _Alternative_ : API NestJS découplée si besoin — non requis pour ce périmètre.
- **Worker de prix** : process séparé, planifié 1×/jour. Ne récupère que les sets **effectivement possédés** (`SELECT DISTINCT set_no FROM user_items`), respecte les quotas, écrit dans `price_snapshots`, recalcule `portfolio_snapshots`.
- **Base** : PostgreSQL + Drizzle (migrations versionnées).
- **Déploiement** : Docker Compose sur Scarif, derrière le Traefik + Authentik existants (cf. §12). Le worker bénéficie de l'IP fixe de Scarif (whitelist BrickLink).

---

## 9. Modèle de données (PostgreSQL / Drizzle)

```
users
  id              uuid pk
  authentik_uid   text unique     -- X-authentik-uid (créé en JIT)
  email           text
  display_name    text
  currency        text default 'EUR'
  created_at      timestamptz

catalog_sets                       -- cache global, mutualisé entre users
  set_no          text pk          -- "75281-1"
  name            text
  theme           text
  subtheme        text
  year            int
  num_parts       int
  image_url       text
  retail_price    numeric
  retirement_status text           -- available | retiring_soon | retired | unknown
  retirement_date date
  last_enriched_at timestamptz

user_items                         -- la "librairie" de l'utilisateur
  id              uuid pk
  user_id         uuid fk -> users
  set_no          text fk -> catalog_sets
  condition       text             -- new_sealed | used
  quantity        int default 1
  completeness    text             -- complete | incomplete | na
  has_box         bool
  has_instructions bool
  has_minifigs    bool
  purchase_price  numeric
  purchase_date   date
  storage_location text
  notes           text
  created_at      timestamptz
  updated_at      timestamptz

price_snapshots                    -- 1 ligne / set / condition / source / jour
  id              uuid pk
  set_no          text fk -> catalog_sets
  condition       text             -- new | used
  source          text             -- bricklink | brickowl
  guide_type      text             -- sold | stock (BrickLink) | listing (Brick Owl)
  currency        text default 'EUR'
  original_currency text           -- ex. GBP pour Brick Owl
  fx_rate         numeric          -- taux appliqué pour la conversion -> EUR
  min_price       numeric
  avg_price       numeric
  max_price       numeric
  qty_avg_price   numeric
  unit_quantity   int
  captured_at     date
  unique(set_no, condition, source, guide_type, captured_at)

portfolio_snapshots                -- valeur agrégée d'un user / jour (perf dashboard)
  id              uuid pk
  user_id         uuid fk -> users
  captured_at     date
  total_value     numeric
  total_cost      numeric
  num_items       int
  unique(user_id, captured_at)
```

Le **prix est global au set**, pas à l'utilisateur. La valeur d'un user se calcule par jointure `user_items × dernier price_snapshot consolidé`. Le rôle admin n'est **pas** stocké : il provient des groupes Authentik.

---

## 10. Intégrations externes & pipeline de prix

### 10.1 BrickLink — source de référence

- API REST en **OAuth 1.0a** (consumer key/secret + token/secret via `register_consumer.page`).
- Endpoint **Price Guide** par item : neuf **et** occasion, variantes `sold` (ventes 6 mois) et `stock` (annonces), min/max/avg/qty_avg, devise EUR.
- **Quota : 5000 requêtes/jour**. On ne rafraîchit que les sets possédés, 1×/jour (~2 requêtes/set) → marge très confortable.
- **Whitelist IP** : tokens liés à l'IP enregistrée → whitelister l'IP publique de Scarif, ou `0.0.0.0` si dynamique (secrets protégés).
- Référence de valorisation : guide `sold`.

### 10.2 Brick Owl — source secondaire

- Auth par **clé API simple** (paramètre de requête).
- **Accès catalogue sur validation** : nécessite une demande aux administrateurs Brick Owl pour activer l'API catalogue (**à anticiper**, délai côté admin).
- **Données prix limitées** : essentiellement un « moins cher disponible » (`cheapest`, en **GBP**), sans découpage fin neuf/occasion ni historique.
- Rôle : **croisement / repli** quand BrickLink est muet, et borne basse de marché. Pas une co-référence.

### 10.3 Rebrickable — métadonnées

- API gratuite (clé simple). Enrichit le catalogue à l'ajout d'un set : nom, thème, année, nb de pièces, image. Pas de prix. Appelée uniquement quand un set n'est pas déjà dans `catalog_sets`.

### 10.4 Pipeline & règle de consolidation

Worker quotidien (04:00 Europe/Paris) :

1. `SELECT DISTINCT set_no` parmi les items possédés.
2. Pour chaque set : fetch BrickLink (neuf + occasion, `sold`) ; fetch Brick Owl (avec conversion GBP→EUR, `fx_rate` historisé).
3. Upsert dans `price_snapshots` (dédup par jour / source).
4. Recalcul des `portfolio_snapshots` de chaque utilisateur.

Consolidation de la **valeur affichée** :

1. BrickLink `sold avg` selon la condition de l'item.
2. À défaut (BrickLink muet) → Brick Owl (cheapest converti), tagué, avec drapeau UI « estimation dégradée ».
3. Les deux snapshots sont conservés (source-taggés) pour comparaison et changement de stratégie ultérieurs.

**Limite assumée — occasion** : le guide occasion est une moyenne toutes annonces confondues, indépendante de la complétude. Pour un set incomplet/sans boîte/sans notice, la valeur affichée est une **référence marché indicative**, pas une estimation de l'exemplaire précis. Les attributs de complétude contextualisent (et pourront pondérer une estimation en v2). À signaler clairement en UI (tooltip).

---

## 11. API (REST)

| Méthode | Route                     | Rôle                                                    |
| ------- | ------------------------- | ------------------------------------------------------- |
| GET     | `/api/me`                 | Profil courant (créé en JIT si nécessaire)              |
| GET     | `/api/items`              | Librairie de l'utilisateur (+ valeur courante calculée) |
| POST    | `/api/items`              | Ajouter un set (déclenche l'enrichissement si nouveau)  |
| PATCH   | `/api/items/:id`          | Éditer un item                                          |
| DELETE  | `/api/items/:id`          | Supprimer un item                                       |
| GET     | `/api/sets/:setNo/lookup` | Aperçu catalogue avant ajout                            |
| GET     | `/api/dashboard`          | KPIs agrégés (§6.1)                                     |
| GET     | `/api/dashboard/history`  | Série temporelle (`portfolio_snapshots`)                |
| GET     | `/api/sets/:setNo/prices` | Historique de prix d'un set (toutes sources)            |
| POST    | `/api/export/xlsx`        | Génère et renvoie l'Excel                               |

Toutes les routes scopent `user_id` via `X-authentik-uid` ; aucune fuite inter-utilisateurs.

---

## 12. Export Excel

Génération serveur (ExcelJS / SheetJS), feuilles :

- **Scellé/Neuf** : n° set · nom · thème · année · pièces · qté · prix d'achat · date · valeur neuf moy · min/max · emplacement · plus-value (€/%).
- **Occasion** : n° set · nom · complétude · boîte/notice/minifigs · qté · prix d'achat · valeur occase moy · min/max · plus-value.
- **Historique** : date · n° set · prix_neuf · prix_occase (pour graphes côté utilisateur).
- **Synthèse** : reprise des KPIs essentiels (§6.1).

---

## 13. Déploiement & infrastructure

Stack Docker Compose sur Scarif, trois services :

- **`citadel-app`** : image Nuxt/Nitro. Sur les réseaux `traefik_proxy` (externe) **et** un réseau interne. **Aucun port exposé** ; labels Traefik (`websecure`, `letsencrypt`, middlewares `default-headers@docker,authentik@file`, port interne `3000`).
- **`citadel-db`** : PostgreSQL, réseau interne uniquement, volume persistant, healthcheck.
- **`citadel-worker`** : même image que l'app, commande dédiée, réseau interne uniquement, cron `node-cron`. Sort vers Internet via l'IP fixe de Scarif (whitelist BrickLink).

Contraintes :

- App et worker partagent la même image (un seul `Dockerfile` multi-stage) ; le worker surcharge la commande.
- App et worker via build local, ou image poussée sur le registre GitLab pour la CI.
- Mono-instance : possibilité d'utiliser les _scheduled tasks_ natives de Nitro au lieu d'un service worker dédié (à éviter si scaling multi-replica).

Les fichiers `docker-compose.yml`, `Dockerfile` et `.env.example` accompagnent cette spec (cf. annexe A).

---

## 14. Non-fonctionnel & sécurité

- **Sécurité** : auth déléguée à Authentik (forward auth), scoping strict par user, app jamais exposée hors Traefik (§7.4), secrets (BrickLink/Brick Owl/Rebrickable, DB) en variables d'environnement / secret manager, HTTPS via Traefik (Let's Encrypt).
- **Confidentialité** : la valeur d'une collection est une donnée sensible ; pas de partage par défaut.
- **Performance** : dashboard servi depuis `portfolio_snapshots` pré-agrégés, pas de recalcul lourd au chargement.
- **Résilience prix** : en cas d'échec d'une source un jour donné, conserver le dernier snapshot connu (pas de trou dans la courbe).
- **Sauvegardes** : dump PostgreSQL planifié (la saisie manuelle est un effort utilisateur à protéger).
- **Coûts API** : un seul fetch/jour/set, mutualisé ; large marge sous le quota BrickLink.

---

## 15. Décisions verrouillées (journal)

| Sujet             | Décision                                                    | Raison                                                   |
| ----------------- | ----------------------------------------------------------- | -------------------------------------------------------- |
| Auth              | Authentik via Traefik forward auth (pas Auth0)              | Stack homelab existante, zéro code d'auth dans l'app     |
| Comptes           | Provisioning JIT sur `X-authentik-uid`                      | Pas de signup à construire, extensible                   |
| Accès             | Délégué à Authentik (groupes), pas d'allow-list applicative | Scaling SSO sans déploiement                             |
| Périmètre         | Privé d'abord, conçu pour le pool SSO                       | Démarrage simple, extensibilité native                   |
| Sources prix      | BrickLink (référence) + Brick Owl (secondaire)              | BrickLink complet ; Brick Owl en croisement/repli        |
| Devise            | EUR uniquement                                              | Simplicité v1 (conversion GBP→EUR pour Brick Owl)        |
| Prix de référence | BrickLink `sold`                                            | Ventes réelles, stable vs annonces                       |
| Déploiement       | Docker sur Scarif derrière Traefik/Authentik                | IP fixe (whitelist BrickLink), intégration reverse proxy |
| Graphes dashboard | Chart.js (`vue-chartjs`)                                    | Lib éprouvée, intégration Vue 3 simple                   |

---

## 16. Roadmap

- **Phase 0 — Socle** : repo Nuxt 4, schéma Drizzle + migrations, vue d'agrégation, intégration Traefik/Authentik (application + provider + outpost + groupe), middleware JIT, Docker.
- **Phase 1 — Worker prix** : clients BrickLink / Brick Owl / Rebrickable, tâche cron, consolidation + repli, gestion quotas/erreurs.
- **Phase 2 — API & ajout de sets** : CRUD items, lookup catalogue, endpoints dashboard.
- **Phase 3 — Front** : librairie, formulaire d'ajout, dashboard (KPIs + courbe + répartitions), détail set.
- **Phase 4 — Export & finitions** : export Excel, sauvegardes, logs, santé.
- **v2** : statut retraite, variations 30/90j, CAGR, concentration, alertes, `stock` BrickLink, multi-devise, import CSV.

---

## 17. Prérequis externes (à lancer tôt)

- [ ] **BrickLink** : créer le consumer (`register_consumer.page`), whitelister l'IP de Scarif (ou `0.0.0.0`).
- [ ] **Brick Owl** : demander l'accès **catalogue** aux admins (validation manuelle — bloquant pour la Phase 1 si non anticipé).
- [ ] **Rebrickable** : générer une clé API.
- [ ] **Authentik** : Application Citadel + Proxy Provider (forward auth single app) + binding outpost + groupe `citadel-admins`.
- [ ] **Traefik** : middleware `authentik@file` (déjà en place) + entrée DNS `citadel.camillepolice.com`.

---

## 18. Risques & questions ouvertes

- **Brick Owl** : accès catalogue sur validation et données prix limitées → confirmer son utilité réelle une fois l'accès obtenu ; sinon BrickLink seul suffit en v1.
- **Whitelist IP BrickLink** : récupérer l'IP publique de Scarif au déploiement (ou stratégie `0.0.0.0`).
- **En-têtes de confiance** : garantir que l'app n'est jamais exposée hors Traefik (revue de conf obligatoire).
- **Conversion GBP→EUR** : choisir la source du taux de change et sa fréquence de rafraîchissement.

---

## Annexe A — Fichiers d'infrastructure

`docker-compose.yml`, `Dockerfile`, `.env.example` sont fournis séparément et constituent la base de déploiement décrite au §13.
