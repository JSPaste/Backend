import { HTTPException } from "@hono/hono/http-exception";
import type { ContentfulStatusCode } from "@hono/hono/utils/http-status";
import { resolver } from "@hono/openapi";
import { type } from "arktype";

// allow const enum in the future
// https://github.com/rolldown/rolldown/issues/7676

export const errorCodeCrash = 1000;
export const errorCodeUnknown = 1001;
export const errorCodeValidation = 1002;
// export const errorCodeParse = 1003; // moved to 1002
export const errorCodeNotFound = 1004;
export const errorCodeDummy = 1005;

// document
export const errorCodeDocumentNotFound = 1200;
export const errorCodeDocumentNameAlreadyExists = 1201;
export const errorCodeDocumentPasswordNeeded = 1202;
export const errorCodeDocumentInvalidSize = 1203;
// export const errorCodeDocumentInvalidNameLength = 1204; // moved to 1002
export const errorCodeDocumentInvalidPassword = 1205;
// export const errorCodeDocumentInvalidPasswordLength = 1206; // moved to 1002
// export const errorCodeDocumentInvalidSecret = 1207; // deprecated
// export const errorCodeDocumentInvalidSecretLength = 1208; // deprecated
// export const errorCodeDocumentInvalidName = 1209; // moved to 1002
export const errorCodeDocumentCorrupted = 1210;

// user
export const errorCodeUserInvalidToken = 1300;

export type ErrorCodeType =
  | typeof errorCodeCrash
  | typeof errorCodeUnknown
  | typeof errorCodeValidation
  // | typeof errorCodeParse
  | typeof errorCodeNotFound
  | typeof errorCodeDummy
  // document
  | typeof errorCodeDocumentNotFound
  | typeof errorCodeDocumentNameAlreadyExists
  | typeof errorCodeDocumentPasswordNeeded
  | typeof errorCodeDocumentInvalidSize
  // | typeof errorCodeDocumentInvalidNameLength
  | typeof errorCodeDocumentInvalidPassword
  // | typeof errorCodeDocumentInvalidPasswordLength
  // | typeof errorCodeDocumentInvalidSecret
  // | typeof errorCodeDocumentInvalidSecretLength
  // | typeof errorCodeDocumentInvalidName
  | typeof errorCodeDocumentCorrupted
  // user
  | typeof errorCodeUserInvalidToken;

export type Schema = {
  httpCode: ContentfulStatusCode;
  message: string;
};

const errorDefinition: Record<ErrorCodeType, Schema> = {
  [errorCodeCrash]: {
    httpCode: 500,
    message:
      "An unexpected server error occurred. If this persists, open an issue at: https://github.com/jspaste/backend/issues"
  },
  [errorCodeUnknown]: {
    httpCode: 503,
    message: "Server handler has not loaded yet. Wait..."
  },
  [errorCodeValidation]: {
    httpCode: 400,
    message: "The request contains invalid or malformed data."
  },
  [errorCodeNotFound]: {
    httpCode: 404,
    message: "The requested resource could not be found."
  },
  [errorCodeDummy]: {
    httpCode: 200,
    message: "Placeholder response for documentation purposes."
  },

  // document
  [errorCodeDocumentNotFound]: {
    httpCode: 404,
    message: "No document exists with the specified name."
  },
  [errorCodeDocumentNameAlreadyExists]: {
    httpCode: 409,
    message: "A document with this name already exists. Choose a different name."
  },
  [errorCodeDocumentPasswordNeeded]: {
    httpCode: 401,
    message: "This document is password protected. Include the password in your request."
  },
  [errorCodeDocumentInvalidSize]: {
    httpCode: 413,
    message: "The document content exceeds the maximum allowed size."
  },
  [errorCodeDocumentInvalidPassword]: {
    httpCode: 403,
    message: "The provided password is incorrect."
  },
  [errorCodeDocumentCorrupted]: {
    httpCode: 500,
    message: "The document content is corrupted and cannot be retrieved."
  },

  // user
  [errorCodeUserInvalidToken]: {
    httpCode: 401,
    message: "The provided authorization token is invalid or missing privileges."
  }
} as const;

export const errorGet = (code: ErrorCodeType, overrideMessage?: string) => {
  const { message } = errorDefinition[code];

  return { code: code, message: overrideMessage ?? message };
};

export const errorThrow = (code: ErrorCodeType, overrideMessage?: string): never => {
  const { httpCode, message } = errorDefinition[code];

  throw new HTTPException(httpCode, {
    res: Response.json({ code: code, message: overrideMessage ?? message })
  });
};

export const genericErrorResponse = {
  content: {
    "application/json": {
      schema: resolver(
        type({
          code: type.number.configure({
            description: "The error code",
            examples: [errorCodeDummy]
          }),
          message: type.string.configure({
            description: "The error description"
          })
        }).configure({
          ref: "GenericError"
        })
      )
    }
  }
} as const;
