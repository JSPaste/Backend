FROM --platform=$BUILDPLATFORM cgr.dev/chainguard/glibc-dynamic:latest-dev AS builder
USER root

RUN set -euxo pipefail; \
  wget -qO- https://mise.run | sh; \
  ln -s $HOME/.local/bin/mise /usr/bin/mise

WORKDIR /build/
COPY . ./

ARG TARGETARCH

RUN set -euxo pipefail; \
  case "$TARGETARCH" in \
  amd64) STANDALONE_TARGET="x86_64-unknown-linux-gnu" ;; \
  arm64) STANDALONE_TARGET="aarch64-unknown-linux-gnu" ;; \
  *) echo "Unsupported architecture: $TARGETARCH" && exit 1 ;; \
  esac; \
  mise trust; \
  STANDALONE_TARGET="$STANDALONE_TARGET" mise run build:standalone

FROM scratch AS dist
COPY --chown=0:0 --from=cgr.dev/chainguard/busybox:latest / /

COPY <<EOF /etc/group
root:x:0:
nonroot:x:65532:
EOF

COPY <<EOF /etc/passwd
root:x:0:0:root:/backend/:/bin/sh
nonroot:x:65532:65532:nonroot:/backend/:/bin/sh
EOF

COPY --chmod=555 --chown=65532:65532 --from=builder /build/dist/backend /backend/server
COPY --chmod=444 --chown=65532:65532 --from=builder /build/LICENSE /backend/

LABEL org.opencontainers.image.created="0001-01-01T00:00:00Z" \
  org.opencontainers.image.description="JSPaste document storage" \
  org.opencontainers.image.licenses="EUPL-1.2" \
  org.opencontainers.image.revision="unspecified" \
  org.opencontainers.image.source="https://github.com/jspaste/backend" \
  org.opencontainers.image.title="jspaste-backend" \
  org.opencontainers.image.url="https://github.com/jspaste/backend" \
  org.opencontainers.image.version="unspecified"

ENV PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin" \
  SSL_CERT_DIR="/etc/ssl/certs" \
  SSL_CERT_FILE="/etc/ssl/certs/ca-certificates.crt" \
  HISTFILE="/dev/null"

VOLUME /backend/storage/

EXPOSE 8080

WORKDIR /backend/
ENTRYPOINT ["/backend/server"]
