# ---- Build stage ----
FROM docker-virtual.artifactory.acorn.cirrostratus.org/node:24.18.0-alpine AS builder

WORKDIR /usr/src/app

# Mark this as a CI-style environment so lifecycle scripts (e.g. postinstall)
# skip local-only steps like the postinstall `prisma generate`, which is run explicitly by
# `yarn build` below.
ENV CI=true

COPY . .

# Install (with dev deps), build, then prune to production deps.
RUN yarn install --immutable  \
&& yarn build \
&& yarn workspaces focus --all --production \
&& yarn cache clean \
&& rm -rf .yarn/cache /root/.npm/_cacache /root/.cache


# ---- Runtime stage ----
FROM docker-virtual.artifactory.acorn.cirrostratus.org/node:24.18.0-alpine AS runtime

WORKDIR /usr/src/app

ENV NODE_ENV=production

# Pick up patched OS packages (e.g. openssl) and npm's own bundled deps
# (e.g. pacote, tar) that aren't pinned via yarn.lock.
RUN apk update && apk upgrade --no-cache \
&& npm install -g npm@latest \
&& rm -rf /var/cache/apk/* /root/.npm

COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/prisma ./prisma
COPY --from=builder /usr/src/app/package.json ./package.json

EXPOSE 8080

CMD ["node", "dist/server.js"]
