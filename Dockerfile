FROM docker-virtual.artifactory.acorn.cirrostratus.org/node:24.13.1-alpine

WORKDIR /usr/src/app
RUN apk update && apk upgrade
RUN npm update -g

COPY . .

RUN yarn install
EXPOSE 8080

RUN yarn build

CMD ["yarn", "node", "dist/server.js"]
