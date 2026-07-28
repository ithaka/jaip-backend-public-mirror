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

COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/prisma ./prisma
COPY --from=builder /usr/src/app/package.json ./package.json

EXPOSE 8080

CMD ["node", "dist/server.js"]
