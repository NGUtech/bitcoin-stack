FROM node:14-alpine3.12 as builder

RUN apk add --no-cache --virtual \
        .gyp \
        python3 \
        make \
        g++

ENV NPM_CONFIG_PREFIX=/home/node/.npm-global

USER node
RUN npm install -g \
        bitcoin-json-rpc@^1.0.2 \
        @grpc/proto-loader@^0.5.2 \
        amqplib@^0.6.0 \
        dotenv@^8.2.0 \
        grpc@^1.24.1 \
        zeromq@^5.1.1

FROM node:14-alpine3.12

COPY --from=builder /home/node /home/node

ENV NODE_PATH=/home/node/.npm-global/lib/node_modules

WORKDIR /usr/src/app