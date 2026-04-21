import { type } from "arktype";
import { createMiddleware } from "hono/factory";

import { mutable } from "#/global.ts";
import { verifyHash } from "#util/crypto.ts";
import { ErrorCode, errorThrow } from "#util/error.ts";
import { validatorUserHeader } from "#util/validator/user.ts";

import type { Env } from "../handler.ts";

export const authMiddleware = createMiddleware<Env>(async (ctx, next) => {
  const authorization = ctx.req.header("authorization");
  if (!authorization) {
    return next();
  }

  const token = validatorUserHeader(authorization);
  if (token instanceof type.errors) {
    return errorThrow(ErrorCode.Validation, token.summary);
  }

  if (!token.includes(".")) {
    // unhashed token
    if (token.length === 32) {
      // @ts-expect-error unindexed select
      const id = mutable.database.user.get("token", token)?.id;
      if (!id) {
        return errorThrow(ErrorCode.UserInvalidToken);
      }

      ctx.set("userId", id);

      return next();
    }

    return errorThrow(ErrorCode.UserInvalidToken);
  }

  const [id] = token.split(".");
  if (!id) {
    return errorThrow(ErrorCode.UserInvalidToken);
  }

  // trying to minimize timing attacks by always calling verifyHash
  const combo = mutable.database.user.get("id", id)?.token ?? "0 0";
  if (!verifyHash(token, combo)) {
    return errorThrow(ErrorCode.UserInvalidToken);
  }

  ctx.set("userId", id);

  await next();
});
