FROM ubuntu:cosmic as builder

ENV TZ Etc/UTC
ENV DEBIAN_FRONTEND noninteractive
RUN apt-get -qq update && apt-get install -y software-properties-common

RUN add-apt-repository -y ppa:bitcoin/bitcoin \
  && add-apt-repository -y universe && apt-get update

RUN apt-get install -y --fix-missing build-essential libtool \
  autotools-dev autoconf pkg-config libssl-dev \
  libboost-all-dev libprotobuf-dev protobuf-compiler \
  libqrencode-dev autoconf openssl libssl-dev libevent-dev \
  libminiupnpc-dev libzmq5-dev libdb4.8-dev libdb4.8++-dev \
  git jq

WORKDIR /build

RUN git clone -n https://github.com/ElementsProject/elements.git . \
  && git checkout elements-0.17.0.2 \
  && ./autogen.sh \
  && ./configure --without-gui --disable-shared --with-pic --disable-tests \
  && make && make install


FROM ubuntu:cosmic

COPY --from=builder /usr/lib /usr/lib
COPY --from=builder /usr/local/bin /usr/local/bin
COPY --from=builder /usr/local/bin/elements-cli /shared/

ADD ./elements.conf /elements/elements.conf
