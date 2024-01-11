#!/bin/bash

for i in $(find src/structures -name '*.proto'); do
    echo "Compiling '${i%%.*}'"
    npx protoc --proto_path="./src/structures" --ts_out="./src/structures" "${i}"
done
