import { type } from "arktype";
import { createMiddleware } from "hono/factory";
import { mutable } from "#/global.mts";
import { verifyHash } from "#util/crypto.mts";
import { errorCodeUserInvalidToken, errorCodeValidation, errorThrow } from "#util/error.mts";
import { validatorUserHeader } from "#util/validator/user.mts";
import type { Env } from "../handler.mts";

export const authMiddleware = createMiddleware<Env>(async (ctx, next) => {
  const authorization = ctx.req.header("authorization");
  if (!authorization) {
    return next();
  }

  const token = validatorUserHeader(authorization);
  if (token instanceof type.errors) {
    return errorThrow(errorCodeValidation, token.summary);
  }

  if (!token.includes(".")) {
    // unhashed token
    if (token.length === 32) {
      // @ts-expect-error unindexed select
      const id = mutable.database.user.get("token", token)?.id;
      if (!id) {
        return errorThrow(errorCodeUserInvalidToken);
      }

      ctx.set("userId", id);

      return next();
    }

    return errorThrow(errorCodeUserInvalidToken);
  }

  const [id] = token.split(".");
  if (!id) {
    return errorThrow(errorCodeUserInvalidToken);
  }

  // trying to minimize timing attacks by always calling verifyHash
  const combo = mutable.database.user.get("id", id)?.token ?? "0 0";
  if (!verifyHash(token, combo)) {
    return errorThrow(errorCodeUserInvalidToken);
  }

  ctx.set("userId", id);

  await next();
});
