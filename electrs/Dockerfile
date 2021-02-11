FROM rust:1.49-alpine3.12 as builder

RUN apk add --no-cache --update \
  alpine-sdk \
  build-base \
  linux-headers \
  clang \
  cmake \
  snappy-dev \
  git

WORKDIR /usr/local/src/electrs

RUN rustup override set 1.49 \
  && git clone -n https://github.com/romanz/electrs.git . \
  && git checkout v0.8.7 \
  && RUSTFLAGS="-C target-feature=-crt-static" cargo install --locked --path .

# Build stage for compiled artifacts
FROM alpine:3.12

RUN apk add --no-cache --update libstdc++

RUN adduser -S electrs

COPY --from=builder /usr/local/cargo/bin/electrs /usr/local/bin/electrs

VOLUME ["/home/electrs"]
ADD ./config.toml /etc/electrs/config.toml

USER electrs

CMD ["electrs"]
