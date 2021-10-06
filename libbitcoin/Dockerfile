FROM alpine:3.12

RUN adduser -S bitcoin
RUN sed -i 's/http\:\/\/dl-cdn.alpinelinux.org/https\:\/\/alpine.global.ssl.fastly.net/g' /etc/apk/repositories
RUN apk --no-cache add autoconf automake build-base linux-headers libevent libtool libressl libzmq git bash

ENV LIBBITCOIN_PREFIX=/opt/libbitcoin
RUN wget https://raw.githubusercontent.com/libbitcoin/libbitcoin-server/version3/install.sh
RUN bash install.sh --prefix=${LIBBITCOIN_PREFIX} --build-boost --build-zmq --disable-shared

USER bitcoin

CMD ["bs"]