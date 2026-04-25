import { type } from "arktype";

import {
  constantDocumentNameLengthMax,
  constantDocumentNameLengthMin,
  constantDocumentPasswordLengthMax,
  constantDocumentPasswordLengthMin
} from "#/global.ts";

import { regexBase64URL } from "../regex.ts";
import { validatorCreationTimestamp } from "./shared.ts";

export const validatorDocumentName = type(regexBase64URL)
  .atLeastLength(constantDocumentNameLengthMin)
  .atMostLength(constantDocumentNameLengthMax)
  .configure({
    ref: "DocumentName",
    description: "The document name",
    examples: ["myDocumentNameHere"],
    expected: (ctx) => {
      // oxlint-disable-next-line typescript-eslint/switch-exhaustiveness-check
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
  .to(type.number.atLeast(constantDocumentNameLengthMin).atMost(constantDocumentNameLengthMax))
  .configure({
    ref: "DocumentNameLength",
    description: "The name length for the document",
    expected: (ctx) => {
      // oxlint-disable-next-line typescript-eslint/switch-exhaustiveness-check
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
  .atLeastLength(constantDocumentPasswordLengthMin)
  .atMostLength(constantDocumentPasswordLengthMax)
  .configure({
    ref: "DocumentPassword.default",
    description: "The password for the document (read access)",
    examples: ["myDocumentPasswordHere"]
  });

export const validatorDocumentPasswordEmpty = type.string.exactlyLength(0).configure({
  ref: "DocumentPassword.empty",
  description: "A blank password for the document",
  examples: [""]
});

export const validatorDocumentPreview = type.unknown.configure({
  ref: "DocumentPreview",
  description: "View document as plain text"
});

export const validatorDocumentListObject = type({
  name: validatorDocumentName,
  created: validatorCreationTimestamp
}).configure({
  // FIXME: schema references not being generated when using toOpenAPISchema()
  // Invalid object key "DocumentListMetadata" at position 2 in "/components/schemas/DocumentListMetadata": key not found in object
  //ref: "DocumentListMetadata",
  description: "An object with document metadata"
});
