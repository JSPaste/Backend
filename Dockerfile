FROM --platform=$BUILDPLATFORM cgr.dev/chainguard/glibc-dynamic:latest-dev AS builder
USER root

RUN set -euxo pipefail; \
  wget -qO- https://mise.run | sh; \
  ln -s $HOME/.local/bin/mise /usr/bin/mise

WORKDIR /build/
COPY . ./

RUN set -euxo pipefail; \
  mise trust; \
  GITHUB_ACTIONS=true mise run build:server

RUN echo "root:x:0:root" >/tmp/.group \
  && echo "root:x:0:0:root:/backend:/bin/ash" >/tmp/.passwd \
  && echo "jspaste:x:7777:jspaste" >>/tmp/.group \
  && echo "jspaste:x:7777:7777:jspaste:/backend:/bin/ash" >>/tmp/.passwd

ARG TARGETOS
ARG TARGETARCH

RUN set -euxo pipefail; \
  mise run build:standalone

FROM --platform=$BUILDPLATFORM scratch AS dist

COPY --from=builder /tmp/.passwd /etc/passwd
COPY --from=builder /tmp/.group /etc/group
COPY --chown=root:root --from=cgr.dev/chainguard/wolfi-base:latest / /
COPY --chown=root:root --from=builder /tmp/.passwd /etc/passwd
COPY --chown=root:root --from=builder /tmp/.group /etc/group
RUN rm -rf /home/

COPY --chown=7777:7777 --from=builder /build/dist/backend /backend/server
COPY --chown=7777:7777 --from=builder /build/LICENSE /backend/

LABEL org.opencontainers.image.created="0001-01-01T00:00:00Z" \
  org.opencontainers.image.description="JSPaste Backend" \
  org.opencontainers.image.licenses="EUPL-1.2" \
  org.opencontainers.image.revision="unspecified" \
  org.opencontainers.image.source="https://github.com/jspaste/backend" \
  org.opencontainers.image.title="jspaste-backend" \
  org.opencontainers.image.url="https://github.com/jspaste/backend" \
  org.opencontainers.image.version="unspecified"

ENV PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin" \
  SSL_CERT_DIR="/etc/ssl/certs" \
  SSL_CERT_FILE="/etc/ssl/certs/ca-certificates.crt" \
  HISTFILE="/dev/null" \
  STORAGE_PATH="/backend/storage/"

EXPOSE 4000

VOLUME $STORAGE_PATH

WORKDIR /backend/
ENTRYPOINT ["/backend/server"]
