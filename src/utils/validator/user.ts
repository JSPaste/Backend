import { type } from "arktype";

import { constantUserTokenLength } from "#/global.ts";

import { regexHeaderBearer } from "../regex.ts";

export const validatorUserToken = type.string.exactlyLength(constantUserTokenLength).configure({
  ref: "UserToken",
  description: "A user token",
  examples: ["myUserTokenHere"],
  expected: (ctx) => {
    // oxlint-disable-next-line typescript-eslint/switch-exhaustiveness-check
    switch (ctx.code) {
      case "domain": {
        return "a string";
      }
      case "exactLength": {
        return `exactly ${ctx.rule} characters`;
      }
      default: {
        return "valid";
      }
    }
  }
});

export const validatorUserHeader = type(regexHeaderBearer)
  .configure({
    description: "A RFC 6750 structured Bearer header",
    expected: "a valid header"
  })
  .pipe((string) => string.split(" ")[1], validatorUserToken);
