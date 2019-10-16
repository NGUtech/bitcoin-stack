FROM ubuntu:cosmic as builder

ENV TZ Etc/UTC
ENV DEBIAN_FRONTEND noninteractive
RUN apt-get -qq update && apt-get install -y software-properties-common

RUN apt-get install -y --fix-missing \
  autoconf automake asciidoc gettext build-essential git libtool libgmp-dev \
  libsqlite3-dev python python3 python3-mako net-tools zlib1g-dev libsodium-dev \
  libboost-all-dev libevent-dev

WORKDIR /build

RUN git clone -n https://github.com/cdecker/lightning.git . \
    && git checkout 1b60aae2db06267f4214c30548655c5c0717fdc4 \
    && ./configure \
    && make && make install

FROM ubuntu:cosmic

COPY --from=builder /usr/lib /usr/lib
COPY --from=builder /usr/local/libexec /usr/local/libexec
COPY --from=builder /usr/local/bin /usr/local/bin

ADD ./lightning.conf /lightningd/lightning.conf
