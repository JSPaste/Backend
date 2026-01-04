import { type } from "arktype";
import { constant } from "#/global.ts";

export const validatorDocumentName = type(/^[A-Za-z0-9_-]+$/)
  .atLeastLength(constant.documentNameLengthMin)
  .atMostLength(constant.documentNameLengthMax)
  .configure({
    ref: "DocumentName",
    description: "The document name",
    examples: ["abc123"],
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

export const validatorDocumentNameLength = type.string.pipe(
  (string) => Number.parseInt(string, 10),
  type.number
    .atLeast(constant.documentNameLengthMin)
    .atMost(constant.documentNameLengthMax)
    .configure({
      ref: "DocumentNameLength",
      description: "The document name length",
      expected: (ctx) => {
        switch (ctx.code) {
          case "domain": {
            return "a valid integer";
          }
          case "min": {
            return `more than ${ctx.rule} length`;
          }
          case "max": {
            return `less than ${ctx.rule} length`;
          }
          default: {
            return "valid";
          }
        }
      }
    })
);

export const validatorDocumentPasswordEmpty = type.string.exactlyLength(0).configure({
  ref: "DocumentPassword.empty",
  description: "The password for the document (should only be used to nullify an existing password)",
  examples: [""]
});

export const validatorDocumentPassword = type.string
  .atLeastLength(constant.documentPasswordLengthMin)
  .atMostLength(constant.documentPasswordLengthMax)
  .configure({
    ref: "DocumentPassword.default",
    description: "The password for the document",
    examples: ["myPassword"]
  });

export const validatorDocumentDownload = type.unknown.configure({
  ref: "DocumentDownload",
  description: "The response will be treated as a file download"
});
