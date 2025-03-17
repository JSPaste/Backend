FROM --platform=$BUILDPLATFORM docker.io/oven/bun:1-alpine AS builder-standalone

WORKDIR /build/
COPY . ./

RUN bun install --frozen-lockfile \
 && bun run build:server

RUN addgroup jspaste \
 && adduser -G jspaste -u 7777 -s /bin/false -D jspaste \
 && grep jspaste /etc/passwd > /tmp/.backend.passwd

ARG TARGETOS
ARG TARGETARCH

RUN bun run build:standalone

FROM --platform=$BUILDPLATFORM docker.io/library/alpine:3.21

RUN apk add --no-cache libstdc++

COPY --from=builder-standalone /tmp/.backend.passwd /etc/passwd
COPY --from=builder-standalone /etc/group /etc/group

WORKDIR /backend/
COPY --chown=jspaste:jspaste --from=builder-standalone /build/dist/server ./
COPY --chown=jspaste:jspaste --from=builder-standalone /build/LICENSE ./

LABEL org.opencontainers.image.created="0001-01-01T00:00:00Z" \
      org.opencontainers.image.description="JSPaste Backend" \
      org.opencontainers.image.licenses="EUPL-1.2" \
      org.opencontainers.image.revision="unspecified" \
      org.opencontainers.image.source="https://github.com/jspaste/backend" \
      org.opencontainers.image.title="jspaste-backend" \
      org.opencontainers.image.url="https://github.com/jspaste/backend" \
      org.opencontainers.image.version="unspecified"

EXPOSE 4000

VOLUME /backend/storage/

USER jspaste:jspaste

ENTRYPOINT ["/backend/server"]