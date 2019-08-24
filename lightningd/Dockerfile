FROM ubuntu:bionic-20190612 as builder

RUN apt-get -qq update && apt-get install -y software-properties-common

RUN apt-get install -y --fix-missing \
  autoconf automake build-essential git libtool libgmp-dev \
  libsqlite3-dev python python3 python3-mako net-tools zlib1g-dev libsodium-dev \
  libboost-all-dev libevent-dev

WORKDIR /build

RUN git clone -n https://github.com/ElementsProject/lightning.git . \
    && git checkout v0.7.2.1 \
    && ./configure \
    && make && make install

FROM ubuntu:bionic-20190612

COPY --from=builder /usr/lib /usr/lib
COPY --from=builder /usr/local/libexec /usr/local/libexec
COPY --from=builder /usr/local/bin /usr/local/bin

ADD ./lightning.conf /lightningd/lightning.conf
