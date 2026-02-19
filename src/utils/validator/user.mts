import { type } from "arktype";
import { constantUserTokenLength } from "#/global.mts";
import { regexBase64URL, regexHeaderBearer } from "../regex.mts";

// FIXME: schema references not being generated when using toOpenAPISchema()
export const validatorUserToken = type.string.exactlyLength(constantUserTokenLength).configure({
  ref: "UserToken.default",
  description: "A user token",
  examples: ["myUserTokenHere"],
  expected: (ctx) => {
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

export const validatorUserTokenLegacy = type(regexBase64URL)
  .exactlyLength(32)
  .configure({
    ref: "UserToken.legacy",
    description: "An unhashed user token",
    examples: ["myUserTokenHere"],
    expected: (ctx) => {
      switch (ctx.code) {
        case "pattern": {
          return "a valid Base64URL";
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
  .pipe((string) => string.split(" ")[1], validatorUserToken.or(validatorUserTokenLegacy));
