#!/usr/bin/env sh
# shellcheck shell=dash
set -eu

./.mise/snippets/condition_cmd.sh git

X_CTX_BRANCH="$(git rev-parse --abbrev-ref HEAD)"
X_CTX_SHA=$(git rev-parse HEAD)
X_CTX_SHA_SHORT="$(printf '%s' "$X_CTX_SHA" | cut -c1-7)"

export X_CTX_BRANCH X_CTX_SHA X_CTX_SHA_SHORT
