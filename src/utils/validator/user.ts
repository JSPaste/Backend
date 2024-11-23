import { type } from "arktype";
import { constant } from "#/global.ts";

export const validatorUserToken = type(/^[A-Za-z0-9_-]+$/)
  .atLeastLength(constant.userTokenLengthMin)
  .atMostLength(constant.userTokenLengthMax)
  .configure({
    description: "The user token",
    examples: ["CW41t9I218GiXyFQtLpKJQ76In-CVK3H"],
    expected: (ctx) => {
      switch (ctx.code) {
        case "pattern": {
          return "a valid Base64URL";
        }
        case "minLength": {
          return `more than ${ctx.rule} characters`;
        }
        case "maxLength": {
          return `less than ${ctx.rule} characters`;
        }
        default: {
          return "valid";
        }
      }
    }
  });

export const validatorUserHeader = type(/^Bearer .+$/)
  .configure({
    description: "The Bearer token",
    expected: "a valid header"
  })
  .pipe((string) => string.split(" ")[1], validatorUserToken);
