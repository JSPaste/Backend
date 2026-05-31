## Dependencies

Everything is managed by..:

- [mise-en-place](https://mise.jdx.dev/installing-mise.html)

After install you need to trust the project..:

```shell
mise trust
```

## Scripts

The project uses `mise` to manage scripts. To list all available scripts..:

```shell
mise run
```

Scripts are grouped, meaning that a script such as `mise run build` will run
other scripts under its name to fulfil its function, in this case building the
backend and compiling the server.

This may not be desired in every case, so it is recommended that scripts be run
in a more granular way..:

```shell
# Build and start
mise run build:server start:server

# Better, we can run the development server
mise run start:dev
```

All scripts will run from any location within the project as if you were in the
main directory, no fear.

## Build

Building the Backend is very straightforward..:

```shell
mise run build
```

It will prepare the server bundle ready to be run in `dist/backend.js`.

You can also build a standalone binary for different platforms..:

```shell
# Build the server bundle
mise run build:server

# Build standalone binary for current platform (requires server bundle)
mise run build:standalone

# ...or other platforms (requires server bundle)
mise run build:standalone:linux-amd64
mise run build:standalone:linux-arm64
mise run build:standalone:darwin-arm64
mise run build:standalone:windows-amd64
```

## API

The API is documented under OpenAPI specification and can be found at the following path:

```shell
/api/docs.json
```

You can get a quick overview with:

- [Swagger Editor](https://editor.swagger.io/?url=https://jspaste.eu/api/docs.json)
- [Scalar Client](https://client.scalar.com/?url=https://jspaste.eu/api/docs.json)

If using Scalar Client, disable the CORS proxy and follow these steps to import the
instance `docs.json`..:

![](https://static.inetol.net/jspaste/backend/scalar-t1.webp)

## Maintenance

If you want to clear the entire project of dependencies and build remnants..:

```shell
mise run clean
```

Over time, local repositories can become messy with untracked files, registered
hooks, and temporary files in the .git folder. To clean up the repository (and
possibly all your uncommitted work), run the following command..:

```shell
# Careful with this one!
mise run clean:git
```
