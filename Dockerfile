FROM docker.io/oven/bun:1-alpine AS builder
WORKDIR /build/

COPY . ./

RUN bun install --frozen-lockfile && \
    bun run build:standalone

FROM docker.io/library/alpine:3.21
WORKDIR /backend/

# FIXME: https://github.com/oven-sh/bun/issues/15307
RUN apk add --no-cache libgcc libstdc++

RUN adduser -D -h /backend jspaste && \
    chown jspaste:jspaste /backend/

COPY --chown=jspaste:jspaste --from=builder /build/dist/backend ./
COPY --chown=jspaste:jspaste --from=builder /build/LICENSE ./

LABEL org.opencontainers.image.url="https://jspaste.eu" \
      org.opencontainers.image.source="https://github.com/jspaste/backend" \
      org.opencontainers.image.title="@jspaste/backend" \
      org.opencontainers.image.description="The backend for JSPaste" \
      org.opencontainers.image.documentation="https://docs.jspaste.eu" \
      org.opencontainers.image.licenses="EUPL-1.2"

ARG BUN_RUNTIME_TRANSPILER_CACHE_PATH=0
ENV BUN_RUNTIME_TRANSPILER_CACHE_PATH=${BUN_RUNTIME_TRANSPILER_CACHE_PATH}

USER jspaste

VOLUME /backend/storage/
EXPOSE 4000

ENTRYPOINT ["./backend"]