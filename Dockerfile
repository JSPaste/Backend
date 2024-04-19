# Builder
FROM cgr.dev/chainguard/bun:latest-dev AS builder
WORKDIR /home/nonroot

COPY . ./

RUN bun install --production --frozen-lockfile && \
    bun run build:standalone

# Runner
FROM cgr.dev/chainguard/cc-dynamic:latest
WORKDIR /home/nonroot

COPY --chown=nonroot --from=builder /home/nonroot/dist/backend ./

LABEL org.opencontainers.image.url="https://jspaste.eu" \
      org.opencontainers.image.source="https://github.com/jspaste/backend" \
      org.opencontainers.image.title="jspaste-backend" \
      org.opencontainers.image.description="The backend for JSPaste, built with Bun and ElysiaJS" \
      org.opencontainers.image.documentation="https://docs.jspaste.eu" \
      org.opencontainers.image.licenses="EUPL-1.2"

VOLUME /home/nonroot/documents
EXPOSE 4000

CMD ["./backend"]