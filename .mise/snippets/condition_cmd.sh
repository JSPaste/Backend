#!/usr/bin/env sh
# shellcheck shell=dash
set -eu

if ! command -v -- "$1" >/dev/null 2>&1; then
    echo >&2 "$1 isn't available on PATH"
    exit 1
fi
