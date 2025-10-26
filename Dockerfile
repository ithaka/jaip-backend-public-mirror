FROM docker-virtual.artifactory.acorn.cirrostratus.org/node:22.21.0-alpine

WORKDIR /usr/src/app

COPY . .

RUN yarn install

EXPOSE 8080

RUN yarn build

CMD ["yarn", "node", "dist/server.js"]