import type { ZlibCompressionOptions } from 'bun';
import * as env from 'env-var';
import { type ServerOptions, ServerVersion } from '../types/Server.ts';
import { t } from 'elysia';
import { type JSPError, JSPErrorCode } from '../types/ErrorHandler.ts';

export const genericErrorType = t.Object(
	{
		type: t.String({ description: 'The error type' }),
		message: t.String({ description: 'The error message' }),
		errorCode: t.String({ description: 'The error code' })
	},
	{ description: 'An object representing an error' }
);

export const serverConfig: Required<ServerOptions> = {
	tls: env.get('TLS').asBoolStrict() ?? false,
	domain: env.get('DOMAIN').default('localhost').asString(),
	port: env.get('PORT').default(4000).asPortNumber(),
	versions: [ServerVersion.v1, ServerVersion.v2],
	files: {},
	docs: {
		enabled: env.get('DOCS_ENABLED').asBoolStrict() ?? true,
		path: env.get('DOCS_PATH').default('/docs').asString(),
		playground: {
			tls: env.get('DOCS_PLAYGROUND_TLS').asBoolStrict() ?? true,
			domain: env.get('DOCS_PLAYGROUND_DOMAIN').default('jspaste.eu').asString(),
			port: env.get('DOCS_PLAYGROUND_PORT').default(443).asPortNumber()
		}
	}
} as const;

export const zlibConfig: ZlibCompressionOptions = {
	level: 6
} as const;

// FIXME(inetol): Migrate to new config system
export const basePath = process.env['DOCUMENTS_PATH'] || 'documents/';
export const maxDocLength = parseInt(process.env['MAX_FILE_LENGTH'] || '2000000');
export const defaultDocumentLifetime = parseInt(process.env['DEFAULT_DOCUMENT_LIFETIME'] || '86400');
export const base64URL = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_' as const;

export const JSPErrorMessage: Record<JSPErrorCode, JSPError> = {
	[JSPErrorCode.unknown]: {
		type: 'error',
		errorCode: JSPErrorCode.unknown,
		message: 'Unknown error, please try again later'
	},
	[JSPErrorCode.notFound]: {
		type: 'error',
		errorCode: JSPErrorCode.notFound,
		message: 'The requested resource does not exist'
	},
	[JSPErrorCode.validation]: {
		type: 'error',
		errorCode: JSPErrorCode.validation,
		message: 'Validation failed, please check our documentation'
	},
	[JSPErrorCode.internalServerError]: {
		type: 'error',
		errorCode: JSPErrorCode.internalServerError,
		message: 'Internal server error. Something went wrong, please try again later'
	},
	[JSPErrorCode.parseFailed]: {
		type: 'error',
		errorCode: JSPErrorCode.parseFailed,
		message: 'Failed to parse the request, please try again later'
	},
	[JSPErrorCode.inputInvalid]: {
		type: 'error',
		errorCode: JSPErrorCode.inputInvalid,
		message: 'The provided document key is not alphanumeric or has an invalid length'
	},
	[JSPErrorCode.documentNotFound]: {
		type: 'error',
		errorCode: JSPErrorCode.documentNotFound,
		message: 'The requested document does not exist'
	},
	[JSPErrorCode.documentPasswordNeeded]: {
		type: 'error',
		errorCode: JSPErrorCode.documentPasswordNeeded,
		message: 'This document requires credentials, however none were provided.'
	},
	[JSPErrorCode.documentInvalidPasswordLength]: {
		type: 'error',
		errorCode: JSPErrorCode.documentInvalidPasswordLength,
		message: 'The provided password length is invalid'
	},
	[JSPErrorCode.documentInvalidPassword]: {
		type: 'error',
		errorCode: JSPErrorCode.documentInvalidPassword,
		message: 'Invalid credentials provided for the document.'
	},
	[JSPErrorCode.documentInvalidLength]: {
		type: 'error',
		errorCode: JSPErrorCode.documentInvalidLength,
		message: 'The document data length is invalid'
	},
	[JSPErrorCode.documentInvalidSecret]: {
		type: 'error',
		errorCode: JSPErrorCode.documentInvalidSecret,
		message: 'Invalid secret provided'
	},
	[JSPErrorCode.documentInvalidSecretLength]: {
		type: 'error',
		errorCode: JSPErrorCode.documentInvalidSecretLength,
		message: 'The provided secret length is invalid'
	},
	[JSPErrorCode.documentInvalidKeyLength]: {
		type: 'error',
		errorCode: JSPErrorCode.documentInvalidKeyLength,
		message: 'The provided key length is invalid'
	},
	[JSPErrorCode.documentKeyAlreadyExists]: {
		type: 'error',
		errorCode: JSPErrorCode.documentKeyAlreadyExists,
		message: 'The provided key already exists'
	}
} as const;

// https://github.com/microsoft/TypeScript/issues/43505
export type Range<
	START extends number,
	END extends number,
	ARR extends unknown[] = [],
	ACC extends number = never
> = ARR['length'] extends END
	? ACC | START | END
	: Range<START, END, [...ARR, 1], ARR[START] extends undefined ? ACC : ACC | ARR['length']>;
