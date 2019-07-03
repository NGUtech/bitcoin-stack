FROM ubuntu:bionic-20190612 as builder

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
  && git checkout 551483eae50ff2ee48ed17d6b22bb1a26284b635 \
  && ./autogen.sh \
  && ./configure --without-gui --disable-tests \
  && make && make install


FROM ubuntu:bionic-20190612

COPY --from=builder /usr/lib /usr/lib
COPY --from=builder /usr/local/bin /usr/local/bin

ADD ./elements.conf /elements/elements.conf
