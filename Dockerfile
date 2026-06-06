# syntax=docker/dockerfile:1

# ---------- Builder ----------
FROM node:22-alpine AS builder
WORKDIR /app
RUN corepack enable

# Dépendances (couche cachée tant que le lockfile ne change pas)
COPY package.json pnpm-lock.yaml .npmrc pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# Code source + build
COPY . .
# 1) build Nuxt/Nitro -> .output/server/index.mjs
# 2) bundle du worker (self-contained) -> .output/worker.mjs
RUN pnpm run build \
 && node scripts/bundle-worker.mjs

# ---------- Runner ----------
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NITRO_PORT=3000

# L'image node:22 fournit déjà l'utilisateur "node" (uid/gid 1000),
# cohérent avec PUID/PGID=1000 de ta stack.
COPY --from=builder --chown=node:node /app/.output ./.output

USER node
EXPOSE 3000

# Commande par défaut = app web. Le worker surcharge via "command" dans le compose.
CMD ["node", ".output/server/index.mjs"]
