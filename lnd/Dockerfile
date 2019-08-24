FROM golang:1.12-alpine as builder

WORKDIR /go/src/github.com/lightningnetwork/lnd

# Force Go to use the cgo based DNS resolver. This is required to ensure DNS
# queries required to connect to linked containers succeed.
ENV GODEBUG netdns=cgo

RUN apk add --no-cache --update alpine-sdk git make \
  && git clone -n https://github.com/lightningnetwork/lnd . \
  && git checkout v0.7.1-beta \
  && make && make install

# Start a new, final image to reduce size.
FROM alpine as final

# Copy the binaries and entrypoint from the builder image.
COPY --from=builder /go/bin/lncli /bin/
COPY --from=builder /go/bin/lnd /bin/

# Add bash.
RUN apk add --no-cache bash

# Import the config
ADD ./lnd.conf /root/.lnd/lnd.conf