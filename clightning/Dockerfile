FROM alpine:3.12 as clightning

RUN sed -i 's/http\:\/\/dl-cdn.alpinelinux.org/https\:\/\/alpine.global.ssl.fastly.net/g' /etc/apk/repositories
RUN apk --no-cache add autoconf \
  automake \
  boost-dev \
  build-base \
  chrpath \
  file \
  gnupg \
  libevent-dev \
  libressl \
  libressl-dev \
  libtool \
  linux-headers \
  protobuf-dev \
  zeromq-dev \
  py3-mako \
  git \
  gmp-dev \
  sqlite-dev \
  gettext

RUN ln -s /usr/bin/python3 /usr/bin/python

RUN set -ex \
  && for key in \
    BFF0F67810C1EED1 \
  ; do \
    gpg --batch --keyserver keyserver.ubuntu.com --recv-keys "$key" || \
    gpg --batch --keyserver pgp.mit.edu --recv-keys "$key" || \
    gpg --batch --keyserver keyserver.pgp.com --recv-keys "$key" || \
    gpg --batch --keyserver ha.pool.sks-keyservers.net --recv-keys "$key" || \
    gpg --batch --keyserver hkp://p80.pool.sks-keyservers.net:80 --recv-keys "$key" ; \
  done

ENV CLIGHTNING_VERSION=0.9.3
ENV CLIGHTNING_PREFIX=/opt/clightning

RUN wget https://github.com/ElementsProject/lightning/releases/download/v${CLIGHTNING_VERSION}/SHA256SUMS
RUN wget https://github.com/ElementsProject/lightning/releases/download/v${CLIGHTNING_VERSION}/SHA256SUMS.asc
RUN wget https://github.com/ElementsProject/lightning/releases/download/v${CLIGHTNING_VERSION}/clightning-v${CLIGHTNING_VERSION}.zip
# @todo get the correct source bundle checksum from somewhere
# RUN gpg --verify SHA256SUMS.asc
# RUN grep " release/clightning-v${CLIGHTNING_VERSION}.zip\$" SHA256SUMS | sed 's/ release\///g' | sha256sum -c -
RUN unzip -q clightning-v${CLIGHTNING_VERSION}.zip

WORKDIR /clightning-v${CLIGHTNING_VERSION}

RUN ./configure --prefix=${CLIGHTNING_PREFIX}
RUN make -j$(nproc)
RUN make install
RUN strip ${CLIGHTNING_PREFIX}/bin/lightning-cli
RUN strip ${CLIGHTNING_PREFIX}/bin/lightningd

# Build stage for compiled artifacts
FROM alpine:3.12

RUN adduser -S clightning
RUN sed -i 's/http\:\/\/dl-cdn.alpinelinux.org/https\:\/\/alpine.global.ssl.fastly.net/g' /etc/apk/repositories
RUN apk --no-cache add \
  bash \
  gmp \
  boost \
  boost-program_options \
  libevent \
  libressl \
  libzmq \
  su-exec \
  # enable support for custom nodejs plugins
  nodejs \
  npm

ENV CLIGHTNING_DATA=/home/clightning/.lightning
ENV CLIGHTNING_PREFIX=/opt/clightning
ENV PATH=${CLIGHTNING_PREFIX}/bin:$PATH

COPY --from=clightning /opt /opt
COPY docker-entrypoint.sh /entrypoint.sh

VOLUME ["/home/clightning/.lightning"]

ADD ./lightning.conf /home/clightning/.lightning/lightning.conf

ENTRYPOINT ["/entrypoint.sh"]

CMD ["lightningd"]