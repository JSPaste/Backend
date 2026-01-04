import { createMiddleware } from "@hono/hono/factory";
import { type } from "arktype";
import { mutable } from "#/global.ts";
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

  const userId = mutable.database.user.get("token", token)?.id;
  if (!userId) {
    return error.throw(ErrorCode.userInvalidToken);
  }

  ctx.set("userId", userId);

  await next();
});
