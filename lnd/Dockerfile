FROM golang:1.18-alpine3.15 as builder

WORKDIR /go/src/github.com/lightningnetwork/lnd

# Force Go to use the cgo based DNS resolver. This is required to ensure DNS
# queries required to connect to linked containers succeed.
ENV GODEBUG netdns=cgo

ARG LND_VERSION
RUN apk add --no-cache --update alpine-sdk git make \
  && git clone -n https://github.com/lightningnetwork/lnd . \
  && git checkout v${LND_VERSION} \
  && make \
  && make install tags="autopilotrpc chainrpc invoicesrpc peersrpc routerrpc signrpc walletrpc watchtowerrpc wtclientrpc"

FROM alpine:3.15

RUN adduser -S lnd
RUN apk add --no-cache bash su-exec

ENV LND_DATA=/home/lnd/.lnd
COPY --from=builder /go/bin/lncli /bin/
COPY --from=builder /go/bin/lnd /bin/
COPY docker-entrypoint.sh /entrypoint.sh
COPY ./lnd.conf /home/lnd/.lnd/lnd.conf

ENTRYPOINT ["/entrypoint.sh"]

CMD ["lnd"]