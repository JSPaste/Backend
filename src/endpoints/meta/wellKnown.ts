import { Hono } from "hono/tiny";

import type { Env } from "#http/handler.ts";
import { env } from "#util/env.ts";

const wellKnown = new Hono<Env>();

export default wellKnown;

wellKnown.get("/.well-known/jspaste", (ctx) =>
  ctx.json({
    document: {
      anonymousTtl: env.JSPB_DOCUMENT_ANONYMOUS_AGE.total("seconds"),
      maxSize: env.JSPB_DOCUMENT_SIZE,
      minSize: 0,
      ttl: env.JSPB_DOCUMENT_AGE.total("seconds")
    },
    path: env.JSPB_API,
    user: {
      public: env.JSPB_USER_REGISTER
    }
  })
);
