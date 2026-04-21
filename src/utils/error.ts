import { resolver } from "@hono/openapi";
import { type } from "arktype";
import { HTTPException } from "hono/http-exception";
import type { ContentfulStatusCode } from "hono/utils/http-status";

export enum ErrorCode {
  Crash = 1000,
  Unknown = 1001,
  Validation = 1002,
  // Parse = 1003, // moved to 1002
  NotFound = 1004,
  Dummy = 1005,

  // document
  DocumentNotFound = 1200,
  DocumentNameAlreadyExists = 1201,
  DocumentPasswordNeeded = 1202,
  DocumentInvalidSize = 1203,
  // DocumentInvalidNameLength = 1204, // moved to 1002
  DocumentInvalidPassword = 1205,
  // DocumentInvalidPasswordLength = 1206, // moved to 1002
  // DocumentInvalidSecret = 1207, // deprecated
  // DocumentInvalidSecretLength = 1208, // deprecated
  // DocumentInvalidName = 1209, // moved to 1002
  DocumentCorrupted = 1210,

  // user
  UserInvalidToken = 1300
}

export type Schema = {
  httpCode: ContentfulStatusCode;
  message: string;
};

const errorDefinition: Record<ErrorCode, Schema> = {
  [ErrorCode.Crash]: {
    httpCode: 500,
    message:
      "An unexpected server error occurred. If this persists, open an issue at: https://github.com/jspaste/backend/issues"
  },
  [ErrorCode.Unknown]: {
    httpCode: 503,
    message: "Server handler has not loaded yet. Wait..."
  },
  [ErrorCode.Validation]: {
    httpCode: 400,
    message: "The request contains invalid or malformed data."
  },
  [ErrorCode.NotFound]: {
    httpCode: 404,
    message: "The requested resource could not be found."
  },
  [ErrorCode.Dummy]: {
    httpCode: 200,
    message: "Placeholder response for documentation purposes."
  },

  // document
  [ErrorCode.DocumentNotFound]: {
    httpCode: 404,
    message: "No document exists with the specified name."
  },
  [ErrorCode.DocumentNameAlreadyExists]: {
    httpCode: 409,
    message: "A document with this name already exists. Choose a different name."
  },
  [ErrorCode.DocumentPasswordNeeded]: {
    httpCode: 401,
    message: "This document is password protected. Include the password in your request."
  },
  [ErrorCode.DocumentInvalidSize]: {
    httpCode: 413,
    message: "The document content exceeds the maximum allowed size."
  },
  [ErrorCode.DocumentInvalidPassword]: {
    httpCode: 403,
    message: "The provided password is incorrect."
  },
  [ErrorCode.DocumentCorrupted]: {
    httpCode: 500,
    message: "The document content is corrupted and cannot be retrieved."
  },

  // user
  [ErrorCode.UserInvalidToken]: {
    httpCode: 401,
    message: "The provided authorization token is invalid or missing privileges."
  }
} as const;

export const errorGet = (code: ErrorCode, overrideMessage?: string): { code: ErrorCode; message: string } => {
  const { message } = errorDefinition[code];

  return { code: code, message: overrideMessage ?? message };
};

export const errorThrow = (code: ErrorCode, overrideMessage?: string): never => {
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
            examples: [ErrorCode.Dummy]
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
