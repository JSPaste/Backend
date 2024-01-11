@echo off

for /R %%i in (src\structures\*.proto) do (
    echo Compiling '%%~ni'
    npx protoc --proto_path=".\src\structures" --ts_out=".\src\structures" "%%~ni.proto" 
)
