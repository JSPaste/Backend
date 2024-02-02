# Builder
FROM docker.io/oven/bun:1.0-slim AS builder
WORKDIR /build/

COPY . ./

RUN bun install --production --frozen-lockfile --ignore-scripts

# Runner
FROM docker.io/oven/bun:1.0-distroless AS runner
WORKDIR /home/nonroot/

COPY --from=builder /build/. ./

ENV DOCS_ENABLED=false

LABEL org.opencontainers.image.url="https://jspaste.eu"
LABEL org.opencontainers.image.source="https://github.com/jspaste/backend"
LABEL org.opencontainers.image.title="JSP-Backend"
LABEL org.opencontainers.image.description="The backend for JSPaste, built with Bun and ElysiaJS"
LABEL org.opencontainers.image.documentation="https://docs.jspaste.eu"
LABEL org.opencontainers.image.licenses="EUPL-1.2"

VOLUME /home/nonroot/documents
EXPOSE 4000/tcp

CMD ["src/index.ts"]