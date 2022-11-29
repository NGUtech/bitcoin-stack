FROM openjdk:11.0.8-jdk-slim as builder

# Setup maven, we don't use https://hub.docker.com/_/maven/ as it declare .m2 as volume, we loose all mvn cache
# We can alternatively do as proposed by https://github.com/carlossg/docker-maven#packaging-a-local-repository-with-the-image
# this was meant to make the image smaller, but we use multi-stage build so we don't care
RUN apt-get update && apt-get install -y curl tar bash git

ARG MAVEN_VERSION=3.6.3
ARG USER_HOME_DIR="/root"
ARG SHA=c35a1803a6e70a126e80b2b3ae33eed961f83ed74d18fcd16909b2d44d7dada3203f1ffe726c17ef8dcca2dcaa9fca676987befeadc9b9f759967a8cb77181c0
ARG BASE_URL=https://apache.osuosl.org/maven/maven-3/${MAVEN_VERSION}/binaries

RUN mkdir -p /usr/share/maven /usr/share/maven/ref \
  && curl -fsSL -o /tmp/apache-maven.tar.gz ${BASE_URL}/apache-maven-${MAVEN_VERSION}-bin.tar.gz \
  && echo "${SHA}  /tmp/apache-maven.tar.gz" | sha512sum -c - \
  && tar -xzf /tmp/apache-maven.tar.gz -C /usr/share/maven --strip-components=1 \
  && rm -f /tmp/apache-maven.tar.gz \
  && ln -s /usr/share/maven/bin/mvn /usr/bin/mvn

ENV MAVEN_HOME /usr/share/maven
ENV MAVEN_CONFIG "$USER_HOME_DIR/.m2"

# Let's fetch eclair dependencies, so that Docker can cache them
# This way we won't have to fetch dependencies again if only the source code changes
# The easiest way to reliably get dependencies is to build the project with no sources
WORKDIR /usr/src
ARG ECLAIR_VERSION
RUN git clone -n https://github.com/ACINQ/eclair.git . && git checkout v${ECLAIR_VERSION}
RUN mvn package -ntp -pl eclair-node -am -DskipTests
# It might be good idea to run the tests here, so that the docker build fail if the code is bugged

# We currently use a debian image for runtime because of some jni-related issue with sqlite
FROM openjdk:11.0.8-jre-slim
WORKDIR /app

# install jq for eclair-cli
RUN apt-get update && apt-get install -y bash jq curl unzip

# copy and install eclair-cli executable
COPY --from=builder /usr/src/eclair-core/eclair-cli .
RUN chmod +x eclair-cli && mv eclair-cli /sbin/eclair-cli

# we only need the eclair-node.zip to run
COPY --from=builder /usr/src/eclair-node/target/eclair-node-*.zip ./eclair-node.zip
RUN unzip eclair-node.zip && mv eclair-node-* eclair-node

COPY ./eclair.conf /data/eclair.conf