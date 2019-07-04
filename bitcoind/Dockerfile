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

RUN git clone -n https://github.com/bitcoin/bitcoin . \
  && git checkout ef70f9b52b851c7997a9f1a0834714e3eebc1fd8 \
  && ./autogen.sh \
  && ./configure --without-gui --disable-tests \
  && make && make install


FROM ubuntu:bionic-20190612

COPY --from=builder /usr/lib /usr/lib
COPY --from=builder /usr/local/bin /usr/local/bin
COPY --from=builder /usr/local/bin/bitcoin-cli /shared/

ADD ./bitcoin.conf /bitcoin/bitcoin.conf