FROM rust:1.53-alpine3.12 as builder

RUN apk add --no-cache --update \
  alpine-sdk \
  build-base \
  linux-headers \
  clang \
  cmake \
  snappy-dev \
  git

WORKDIR /usr/local/src/electrs

RUN rustup override set 1.53 \
  && git clone -n https://github.com/romanz/electrs.git . \
  && git checkout v0.9.0 \
  && RUSTFLAGS="-C target-feature=-crt-static" cargo install --locked --path .

# Build stage for compiled artifacts
FROM alpine:3.12

RUN adduser -S electrs

RUN apk add --no-cache --update libstdc++

COPY --from=builder /usr/local/cargo/bin/electrs /usr/local/bin/electrs
COPY ./config.toml /etc/electrs/config.toml

USER electrs

CMD ["electrs"]
