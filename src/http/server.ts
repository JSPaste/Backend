import { constant } from "#/global.ts";
import { Logger } from "#util/console.ts";
import { ErrorCode, error } from "../utils/error.ts";

const log: Logger = new Logger("http");

const dummyHandler = (): Response => {
  return Response.json(
    {
      ...error.get(ErrorCode.unknown)
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

export const server = (options?: Options): Deno.HttpServer<Deno.NetAddr> => {
  const handlerDefault: Deno.ServeHandler<Deno.NetAddr> = options?.handler ?? dummyHandler;

  return Deno.serve({
    transport: "tcp",
    hostname: constant.env.JSPB_HOSTNAME.root,
    port: constant.env.JSPB_PORT,
    handler: handlerDefault,
    onListen: () => {
      if (options?.handler) {
        log.info(
          `Listening on ${constant.env.JSPB_HOSTNAME.isIPv6 ? `[${constant.env.JSPB_HOSTNAME.root}]` : constant.env.JSPB_HOSTNAME.root}:${constant.env.JSPB_PORT}`
        );
      }
    }
  });
};
