FROM node:14-alpine3.12

RUN apk add --no-cache --update git

ENV NPM_CONFIG_PREFIX=/home/node/.npm-global

WORKDIR /usr/src/app

RUN git clone -n https://github.com/decentralized-identity/ion.git . \
  && git checkout v1.0.1

RUN npm install && npm run build

# match bitcoin user id
RUN adduser -S -u 100 -G node ion

USER ion