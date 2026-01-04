import { HTTPException } from "@hono/hono/http-exception";
import type { ContentfulStatusCode } from "@hono/hono/utils/http-status";
import { resolver } from "@hono/openapi";
import { type } from "arktype";

export const ErrorCode = {
  crash: 1000,
  unknown: 1001,
  validation: 1002,
  // parse: 1003, // moved to 1002
  notFound: 1004,
  dummy: 1005,

  // document
  documentNotFound: 1200,
  documentNameAlreadyExists: 1201,
  documentPasswordNeeded: 1202,
  documentInvalidSize: 1203,
  // documentInvalidNameLength: 1204, // moved to 1002
  documentInvalidPassword: 1205,
  // documentInvalidPasswordLength: 1206, // moved to 1002
  // documentInvalidSecret: 1207, // deprecated
  // documentInvalidSecretLength: 1208, // deprecated
  // documentInvalidName: 1209, // moved to 1002
  documentCorrupted: 1210,

  // user
  userInvalidToken: 1300
} as const;

export type ErrorCodeType = (typeof ErrorCode)[keyof typeof ErrorCode];

export type Schema = {
  httpCode: ContentfulStatusCode;
  message: string;
};

const errorDefinition: Record<ErrorCodeType, Schema> = {
  [ErrorCode.crash]: {
    httpCode: 500,
    message:
      "An unexpected server error occurred. If this persists, open an issue at: https://github.com/jspaste/backend/issues"
  },
  [ErrorCode.unknown]: {
    httpCode: 503,
    message: "Server handler has not loaded yet. Wait..."
  },
  [ErrorCode.validation]: {
    httpCode: 400,
    message: "The request contains invalid or malformed data."
  },
  [ErrorCode.notFound]: {
    httpCode: 404,
    message: "The requested resource could not be found."
  },
  [ErrorCode.dummy]: {
    httpCode: 200,
    message: "Placeholder response for documentation purposes."
  },

  // document
  [ErrorCode.documentNotFound]: {
    httpCode: 404,
    message: "No document exists with the specified name."
  },
  [ErrorCode.documentNameAlreadyExists]: {
    httpCode: 409,
    message: "A document with this name already exists. Choose a different name."
  },
  [ErrorCode.documentPasswordNeeded]: {
    httpCode: 401,
    message: "This document is password protected. Include the password in your request."
  },
  [ErrorCode.documentInvalidSize]: {
    httpCode: 413,
    message: "The document content exceeds the maximum allowed size."
  },
  [ErrorCode.documentInvalidPassword]: {
    httpCode: 403,
    message: "The provided password is incorrect."
  },
  [ErrorCode.documentCorrupted]: {
    httpCode: 500,
    message: "The document content is corrupted and cannot be retrieved."
  },

  // user
  [ErrorCode.userInvalidToken]: {
    httpCode: 401,
    message: "The provided authorization token is invalid or missing privileges."
  }
} as const;

export const error = {
  get: (code: ErrorCodeType, overrideMessage?: string) => {
    const { message } = errorDefinition[code];

    return { code: code, message: overrideMessage ?? message };
  },

  throw: (code: ErrorCodeType, overrideMessage?: string): never => {
    const { httpCode, message } = errorDefinition[code];

    throw new HTTPException(httpCode, {
      res: Response.json({ code: code, message: overrideMessage ?? message })
    });
  }
} as const;

export const genericErrorResponse = {
  content: {
    "application/json": {
      schema: resolver(
        type({
          code: type.number.configure({
            description: "The error code",
            examples: [ErrorCode.dummy]
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
