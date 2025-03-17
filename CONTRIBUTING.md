### API

The API is documented under OpenAPI specification and can be found at the following path:

```shell
/:apipath/oas.json
```

There are several ways to interact with the API, we will cover its use with [Scalar](https://scalar.com).

We recommend using the desktop application, however,
you can also use the [web-based environment](https://client.scalar.com). (you may need to disable the CORS Proxy)

Follow these steps to import the instance's `oas.json` to Scalar..:

![](https://static.x.inetol.net/jspaste/backend/scalar-t1.gif)

### Maintenance

Over time, local repositories can become messy with untracked files, registered hooks, and temporary files in the .git
folder. To clean up the repository (and possibly all your uncommitted work), run the following command..:

```shell
bun run clean:git:all
```