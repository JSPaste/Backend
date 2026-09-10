#!/usr/bin/env sh
# shellcheck shell=dash
set -eu

set +u
if [ "$GITHUB_ACTIONS" != "true" ]; then
    echo >&2 "This task is intended to be run in GHA"
    exit 1
fi
set -u
