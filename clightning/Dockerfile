FROM alpine:3.12 as builder

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
  python3-dev \
  py3-mako \
  py3-pip \
  py3-setuptools \
  git \
  gmp-dev \
  sqlite-dev \
  gettext

RUN ln -s /usr/bin/python3 /usr/bin/python

ARG CLIGHTNING_VERSION
ENV CLIGHTNING_PREFIX=/opt/clightning

RUN wget -nv https://github.com/ElementsProject/lightning/releases/download/v${CLIGHTNING_VERSION}/SHA256SUMS
RUN wget -nv https://github.com/ElementsProject/lightning/releases/download/v${CLIGHTNING_VERSION}/SHA256SUMS.asc
RUN wget -nv https://github.com/ElementsProject/lightning/releases/download/v${CLIGHTNING_VERSION}/clightning-v${CLIGHTNING_VERSION}.zip
RUN grep "clightning-v${CLIGHTNING_VERSION}.zip\$" SHA256SUMS | sha256sum -c -
RUN SIGNER_KEY=$(gpg --dry-run --verify SHA256SUMS.asc 2>&1 | grep "RSA key" | rev | cut -d' ' -f1 | rev)
RUN gpg --batch --keyserver keys.openpgp.org --recv-keys ${SIGNER_KEY} || true
RUN gpg --batch --keyserver keyserver.ubuntu.com --recv-keys ${SIGNER_KEY} || true
RUN gpg --verify SHA256SUMS.asc
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

COPY --from=builder /opt /opt
COPY docker-entrypoint.sh /entrypoint.sh
COPY ./lightning.conf /home/clightning/.lightning/lightning.conf

ENTRYPOINT ["/entrypoint.sh"]

CMD ["lightningd"]