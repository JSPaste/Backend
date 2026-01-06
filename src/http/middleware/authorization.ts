import { createMiddleware } from "@hono/hono/factory";
import { type } from "arktype";
import { mutable } from "#/global.ts";
import { verifyHash } from "#util/crypto.ts";
import { ErrorCode, error } from "#util/error.ts";
import { validatorUserHeader } from "#util/validator/user.ts";
import type { Env } from "../type.ts";

export const authMiddleware = createMiddleware<Env>(async (ctx, next) => {
  const authorization = ctx.req.header("authorization");
  if (!authorization) {
    return next();
  }

  const token = validatorUserHeader(authorization);
  if (token instanceof type.errors) {
    return error.throw(ErrorCode.validation, token.summary);
  }

  if (!token.includes(".")) {
    // unhashed token
    if (token.length === 32) {
      // @ts-expect-error unindexed select
      const id = mutable.database.user.get("token", token)?.id;
      if (!id) {
        return error.throw(ErrorCode.userInvalidToken);
      }

      ctx.set("userId", id);

      return next();
    }

    return error.throw(ErrorCode.userInvalidToken);
  }

  const [id] = token.split(".");
  if (!id) {
    return error.throw(ErrorCode.userInvalidToken);
  }

  // trying to minimize timing attacks by always calling verifyHash
  const combo = mutable.database.user.get("id", id)?.token ?? "0 0";
  if (!verifyHash(token, combo)) {
    return error.throw(ErrorCode.userInvalidToken);
  }

  ctx.set("userId", id);

  await next();
});
