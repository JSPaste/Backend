import { type } from "arktype";
import { constant } from "#/global.ts";
import { regexBase64URL, regexHeaderBearer } from "./regex.ts";

export const validatorUserToken = type(regexBase64URL)
  .atLeastLength(constant.userTokenLengthMin)
  .atMostLength(constant.userTokenLengthMax)
  .configure({
    description: "A user token",
    examples: ["myUserTokenHere"],
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

export const validatorUserHeader = type(regexHeaderBearer)
  .configure({
    description: "A RFC 6750 structured Bearer header",
    expected: "a valid header"
  })
  .pipe((string) => string.split(" ")[1], validatorUserToken);
