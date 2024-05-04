FROM docker.io/oven/bun:1-alpine AS builder
WORKDIR /build/

COPY . ./

RUN bun install --production --frozen-lockfile && \
    bun run build:standalone

FROM cgr.dev/chainguard/cc-dynamic:latest
WORKDIR /backend/

COPY --chown=nonroot --from=builder /build/dist/backend /backend/

LABEL org.opencontainers.image.url="https://jspaste.eu" \
      org.opencontainers.image.source="https://github.com/jspaste/backend" \
      org.opencontainers.image.title="jspaste-backend" \
      org.opencontainers.image.description="The backend for JSPaste, built with Bun and ElysiaJS" \
      org.opencontainers.image.documentation="https://docs.jspaste.eu" \
      org.opencontainers.image.licenses="EUPL-1.2"

VOLUME /backend/documents/
EXPOSE 4000

ENTRYPOINT ["./backend"]