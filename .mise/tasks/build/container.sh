#!/usr/bin/env sh
# shellcheck shell=dash
set -eu

#MISE description="Build container image"

#USAGE flag "--release" help="Push to registries" default="false"
#USAGE arg "<target>" default="linux/amd64,linux/arm64"

./.mise/snippets/condition_cmd.sh podman

. ./.mise/snippets/get_ctx.sh

X_TIMESTAMP_ISO="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
X_PODMAN_TAG_VERSION="$(date -u +%Y.%m.%d)-$X_CTX_SHA_SHORT"

set +u
if [ "$GITHUB_ACTIONS" != "true" ]; then
    X_PODMAN_TAG_HEADER="latest"
elif [ "$X_CTX_BRANCH" = "stable" ]; then
    X_PODMAN_TAG_HEADER="latest"
else
    X_PODMAN_TAG_HEADER="snapshot"
fi
set -u

X_PODMAN_TARGET="$usage_target"
X_PODMAN_RELEASE="$usage_release"
X_PODMAN_IMAGE="jspaste/backend"
X_PODMAN_MANIFEST="localhost/$X_PODMAN_IMAGE:latest"
X_PODMAN_TAGS="$X_PODMAN_TAG_VERSION
$X_PODMAN_TAG_HEADER
"
X_PODMAN_REGISTRIES="ghcr.io
docker.io
"

if podman manifest exists "$X_PODMAN_MANIFEST"; then
    podman manifest rm "$X_PODMAN_MANIFEST"
fi

podman build --format=oci --squash-all --layers --identity-label=false \
  --platform="$X_PODMAN_TARGET" \
  --manifest="$X_PODMAN_MANIFEST" \
  --label="org.opencontainers.image.created=$X_TIMESTAMP_ISO" \
  --label="org.opencontainers.image.revision=$X_CTX_SHA" \
  --label="org.opencontainers.image.version=$X_PODMAN_TAG_VERSION" \
  .

if [ "$X_PODMAN_RELEASE" = "true" ]; then
    printf '%s' "$X_PODMAN_REGISTRIES" |
      while IFS='' read -r registry
      do
          printf '%s' "$X_PODMAN_TAGS" |
            while IFS='' read -r tag
            do
                podman manifest push --all \
                  "$X_PODMAN_MANIFEST" \
                  "docker://$registry/$X_PODMAN_IMAGE:$tag"
            done
      done
fi
