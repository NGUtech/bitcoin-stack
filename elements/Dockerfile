# Modified from original at https://github.com/ruimarinho/docker-bitcoin-core/tree/master/0.18/alpine/Dockerfile

# The MIT License (MIT)

# Copyright (c) 2015 Rui Marinho

# Permission is hereby granted, free of charge, to any person obtaining a copy
# of this software and associated documentation files (the "Software"), to deal
# in the Software without restriction, including without limitation the rights
# to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
# copies of the Software, and to permit persons to whom the Software is
# furnished to do so, subject to the following conditions:

# The above copyright notice and this permission notice shall be included in
# all copies or substantial portions of the Software.

# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
# IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
# FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
# AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
# LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
# OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
# THE SOFTWARE.

# Build stage for BerkeleyDB
FROM alpine:3.12 as berkeleydb

RUN sed -i 's/http\:\/\/dl-cdn.alpinelinux.org/https\:\/\/alpine.global.ssl.fastly.net/g' /etc/apk/repositories
RUN apk --no-cache add autoconf automake build-base libressl

ENV BERKELEYDB_VERSION=db-4.8.30.NC
ENV BERKELEYDB_PREFIX=/opt/${BERKELEYDB_VERSION}

RUN wget -nv https://download.oracle.com/berkeley-db/${BERKELEYDB_VERSION}.tar.gz
RUN tar -xzf *.tar.gz
RUN sed s/__atomic_compare_exchange/__atomic_compare_exchange_db/g -i ${BERKELEYDB_VERSION}/dbinc/atomic.h
RUN mkdir -p ${BERKELEYDB_PREFIX}

WORKDIR /${BERKELEYDB_VERSION}/build_unix
ARG TARGETARCH
RUN if [ "${TARGETARCH}" = "arm64" ] ; \
  then ../dist/configure --enable-cxx --disable-shared --with-pic --prefix=${BERKELEYDB_PREFIX} --build=arm-unknown-linux ; \
  else ../dist/configure --enable-cxx --disable-shared --with-pic --prefix=${BERKELEYDB_PREFIX} ; fi
RUN make -j$(nproc)
RUN make install
RUN rm -rf ${BERKELEYDB_PREFIX}/docs

# Build stage for Elements Core
FROM alpine:3.12 as builder

COPY --from=berkeleydb /opt /opt

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
 zeromq-dev

ARG ELEMENTS_VERSION
ENV ELEMENTS_PREFIX=/opt/elements

RUN wget -nv https://github.com/ElementsProject/elements/releases/download/elements-${ELEMENTS_VERSION}/SHA256SUMS.asc
RUN wget -nv https://github.com/ElementsProject/elements/archive/elements-${ELEMENTS_VERSION}.tar.gz
# RUN grep "elements-${ELEMENTS_VERSION}.tar.gz\$" SHA256SUMS.asc | sha256sum -c -
RUN SIGNER_KEY=$(gpg --dry-run --verify SHA256SUMS.asc 2>&1 | grep "RSA key" | rev | cut -d' ' -f1 | rev)
RUN gpg --batch --keyserver keys.openpgp.org --recv-keys ${SIGNER_KEY}
RUN gpg --batch --keyserver keyserver.ubuntu.com --recv-keys ${SIGNER_KEY}
RUN gpg --verify SHA256SUMS.asc
RUN tar -xzf *.tar.gz

WORKDIR /elements-elements-${ELEMENTS_VERSION}

RUN sed -i '/AC_PREREQ/a\AR_FLAGS=cr' src/univalue/configure.ac
RUN sed -i '/AX_PROG_CC_FOR_BUILD/a\AR_FLAGS=cr' src/secp256k1/configure.ac
RUN sed -i s:sys/fcntl.h:fcntl.h: src/compat.h
RUN ./autogen.sh
RUN ./configure LDFLAGS=-L`ls -d /opt/db*`/lib/ CPPFLAGS=-I`ls -d /opt/db*`/include/ \
    --prefix=${ELEMENTS_PREFIX} \
    --mandir=/usr/share/man \
    --disable-tests \
    --disable-bench \
    --disable-ccache \
    --with-gui=no \
    --with-utils \
    --with-libs \
    --with-daemon
RUN make -j$(nproc)
RUN make install
RUN strip ${ELEMENTS_PREFIX}/bin/elements-cli
RUN strip ${ELEMENTS_PREFIX}/bin/elements-tx
RUN strip ${ELEMENTS_PREFIX}/bin/elementsd
RUN strip ${ELEMENTS_PREFIX}/lib/libelementsconsensus.a
RUN strip ${ELEMENTS_PREFIX}/lib/libelementsconsensus.so.0.0.0

# Build stage for compiled artifacts
FROM alpine:3.12

RUN adduser -S elements
RUN sed -i 's/http\:\/\/dl-cdn.alpinelinux.org/https\:\/\/alpine.global.ssl.fastly.net/g' /etc/apk/repositories
RUN apk --no-cache add \
  bash \
  boost \
  boost-program_options \
  libevent \
  libressl \
  libzmq \
  su-exec

ENV ELEMENTS_DATA=/home/elements/.elements
ENV ELEMENTS_PREFIX=/opt/elements
ENV PATH=${ELEMENTS_PREFIX}/bin:$PATH

COPY --from=builder /opt /opt
COPY docker-entrypoint.sh /entrypoint.sh
COPY ./elements.conf /home/elements/.elements/elements.conf

ENTRYPOINT ["/entrypoint.sh"]

CMD ["elementsd"]