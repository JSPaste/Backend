#!/usr/bin/env sh

find src/structures -name '*.proto' -exec sh -c '
    echo "Compiling \"${1%.*}\""
    bunx protoc --proto_path="./src/structures" --ts_out="./src/structures" "$1"
' sh {} \;
