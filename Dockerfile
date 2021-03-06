###################################
#Build stage
FROM golang:1.14-alpine3.11 AS build-env

ARG GOPROXY=off
ENV GOPROXY ${GOPROXY:-direct}

ARG GITEA_VERSION
ENV TAGS "bindata"
ENV ALPINE_MIRROR "http://dl-cdn.alpinelinux.org/alpine"

RUN echo "${ALPINE_MIRROR}/edge/main" >> /etc/apk/repositories


#Build deps
RUN apk --no-cache add build-base git nodejs npm  --repository="http://dl-cdn.alpinelinux.org/alpine/edge/main"

#Setup repo
COPY . ${GOPATH}/src/code.gitea.io/gitea
WORKDIR ${GOPATH}/src/code.gitea.io/gitea

#Checkout version if set
RUN make clean-all build

FROM alpine:3.11
LABEL maintainer="ivan@sci-code.com"

EXPOSE 22 3000
RUN echo "http://dl-cdn.alpinelinux.org/alpine/edge/main" >> /etc/apk/repositories

RUN apk --no-cache add \
    bash \
    ca-certificates \
    curl \
    gettext \
    git \
    linux-pam \
    openssh \
    s6 \
    su-exec \
    tzdata \
    gnupg --repository="http://dl-cdn.alpinelinux.org/alpine/edge/main"

RUN addgroup \
    -S -g 1000 \
    git && \
  adduser \
    -S -H -D \
    -h /data/git \
    -s /bin/bash \
    -u 1000 \
    -G git \
    git && \
  echo "git:$(dd if=/dev/urandom bs=24 count=1 status=none | base64)" | chpasswd

ENV USER git
ENV GITEA_CUSTOM /data/gitea

VOLUME ["/data"]

ENTRYPOINT ["/usr/bin/entrypoint"]
CMD ["/bin/s6-svscan", "/etc/s6"]

COPY docker/root /
COPY --from=build-env /go/src/code.gitea.io/gitea/gitea /app/gitea/gitea
RUN ln -s /app/gitea/gitea /usr/local/bin/gitea
