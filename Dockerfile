# ---- Build stage ----
FROM docker-virtual.artifactory.acorn.cirrostratus.org/node:24.18.0-alpine AS builder

WORKDIR /usr/src/app
RUN npm update -g

COPY . .

RUN yarn install

RUN yarn build

# Remove devDependencies from node_modules
RUN npm prune --omit=dev

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
