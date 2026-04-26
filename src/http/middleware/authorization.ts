import { type } from "arktype";
import { createMiddleware } from "hono/factory";

import { mutableDatabase } from "#/global.ts";
import type { Env } from "#http/handler.ts";
import { verifyHash } from "#util/crypto.ts";
import { ErrorCode, errorThrow } from "#util/error.ts";
import { validatorUserHeader } from "#util/validator/user.ts";

export const authMiddleware = createMiddleware<Env>(async (ctx, next) => {
  const authorization = ctx.req.header("authorization");
  if (!authorization) {
    return next();
  }

  const token = validatorUserHeader(authorization);
  if (token instanceof type.errors) {
    return errorThrow(ErrorCode.Validation, token.summary);
  }

  const dotIndex = token.indexOf(".");
  if (dotIndex === -1) {
    // unhashed token
    if (token.length === 32) {
      // @ts-expect-error unindexed select
      const id = mutableDatabase.user.get("token", token)?.id;
      if (!id) {
        return errorThrow(ErrorCode.UserInvalidToken);
      }

      ctx.set("userId", id);

      return next();
    }

    return errorThrow(ErrorCode.UserInvalidToken);
  }

  const id = token.slice(0, dotIndex);
  if (!id) {
    return errorThrow(ErrorCode.UserInvalidToken);
  }

  // trying to minimize timing attacks by always calling verifyHash
  const combo = mutableDatabase.user.get("id", id)?.token ?? "0 0";
  if (!verifyHash(token, combo)) {
    return errorThrow(ErrorCode.UserInvalidToken);
  }

  ctx.set("userId", id);

  await next();
});
