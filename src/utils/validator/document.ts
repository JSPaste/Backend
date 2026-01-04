import { type } from "arktype";
import { constant } from "#/global.ts";
import { regexBase64URL } from "./regex.ts";

export const validatorDocumentName = type(regexBase64URL)
  .atLeastLength(constant.documentNameLengthMin)
  .atMostLength(constant.documentNameLengthMax)
  .configure({
    ref: "DocumentName",
    description: "A name for the document",
    examples: ["myDocumentNameHere"],
    expected: (ctx) => {
      switch (ctx.code) {
        case "pattern": {
          return "a valid Base64URL";
        }
        case "minLength": {
          return `at least ${ctx.rule} characters long`;
        }
        case "maxLength": {
          return `at most ${ctx.rule} characters long`;
        }
        default: {
          return "valid";
        }
      }
    }
  });

export const validatorDocumentNameLength = type.keywords.string.integer.parse
  .to(type.number.atLeast(constant.documentNameLengthMin).atMost(constant.documentNameLengthMax))
  .configure({
    ref: "DocumentNameLength",
    description: "The name length for a document",
    expected: (ctx) => {
      switch (ctx.code) {
        case "domain": {
          return "a valid integer";
        }
        case "min": {
          return `must be greater than ${ctx.rule}`;
        }
        case "max": {
          return `must be less than ${ctx.rule}`;
        }
        default: {
          return "valid";
        }
      }
    }
  });

export const validatorDocumentPassword = type.string
  .atLeastLength(constant.documentPasswordLengthMin)
  .atMostLength(constant.documentPasswordLengthMax)
  .configure({
    ref: "DocumentPassword.default",
    description: "A password for the document (for read access)",
    examples: ["myDocumentPasswordHere"]
  });

export const validatorDocumentPasswordEmpty = type.string.exactlyLength(0).configure({
  ref: "DocumentPassword.empty",
  description: "A blank password for the document",
  examples: [""]
});

export const validatorDocumentDownload = type.unknown.configure({
  ref: "DocumentDownload",
  description: "Indicate the client that downloads the document as a file attachment (only useful in web browsers)"
});
