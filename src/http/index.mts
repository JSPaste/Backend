import { Logger } from "#util/console.mts";
import { env } from "../utils/env.mts";
import { errorCodeUnknown, errorGet } from "../utils/error.mts";

const log: Logger = new Logger("http");

const dummyHandler = (): Response => {
  return Response.json(
    {
      ...errorGet(errorCodeUnknown)
    },
    {
      status: 503,
      headers: {
        // disable compression
        // https://docs.deno.com/runtime/fundamentals/http_server/#automatic-body-compression
        "Cache-Control": "no-transform"
      }
    }
  );
};

type Options = {
  handler?: Deno.ServeHandler<Deno.NetAddr>;
};

export const http = (options: Options = {}): Deno.HttpServer<Deno.NetAddr> => {
  const usingHandler: boolean = typeof options.handler !== "undefined";

  options.handler ??= dummyHandler;

  return Deno.serve({
    transport: "tcp",
    hostname: env.JSPB_HOSTNAME.root,
    port: env.JSPB_PORT,
    handler: options.handler,
    onListen: () => {
      if (usingHandler) {
        log.info(
          `Listening on ${env.JSPB_HOSTNAME.isIPv6 ? `[${env.JSPB_HOSTNAME.root}]` : env.JSPB_HOSTNAME.root}:${env.JSPB_PORT}`
        );
      }
    }
  });
};
