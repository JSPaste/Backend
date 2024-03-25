# Builder
FROM docker.io/imbios/bun-node:1-21-alpine AS builder
WORKDIR /build

COPY . ./

RUN bun install --production --frozen-lockfile && \
    bun run build:bundle

# Runner
FROM cgr.dev/chainguard/bun:latest
WORKDIR /home/nonroot

COPY --chown=nonroot --from=builder /build/dist/backend.js ./

LABEL org.opencontainers.image.url="https://jspaste.eu" \
      org.opencontainers.image.source="https://github.com/jspaste/backend" \
      org.opencontainers.image.title="jspaste-backend" \
      org.opencontainers.image.description="The backend for JSPaste, built with Bun and ElysiaJS" \
      org.opencontainers.image.documentation="https://docs.jspaste.eu" \
      org.opencontainers.image.licenses="EUPL-1.2"

VOLUME /home/nonroot/documents
EXPOSE 4000/tcp

CMD ["backend.js"]