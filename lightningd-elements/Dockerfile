FROM ubuntu:cosmic as builder

ENV TZ Etc/UTC
ENV DEBIAN_FRONTEND noninteractive
RUN apt-get -qq update && apt-get install -y software-properties-common

RUN apt-get install -y --fix-missing \
  autoconf automake asciidoc build-essential git libtool libgmp-dev \
  libsqlite3-dev python python3 python3-mako net-tools zlib1g-dev libsodium-dev \
  libboost-all-dev libevent-dev

WORKDIR /build

RUN git clone -n https://github.com/cdecker/lightning.git . \
    && git checkout lightning-elements \
    && git revert -n 0ce13f463ce25f2fbb949a694b271c6442c93794 \
    && ./configure \
    && make && make install

FROM ubuntu:cosmic

COPY --from=builder /usr/lib /usr/lib
COPY --from=builder /usr/local/libexec /usr/local/libexec
COPY --from=builder /usr/local/bin /usr/local/bin

ADD ./lightning.conf /lightningd/lightning.conf
