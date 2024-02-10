import type { ServerOptions } from '../interfaces/ServerOptions.ts';
import type { ZlibCompressionOptions } from 'bun';
import type { JSPError } from '../classes/ErrorSender.ts';
import * as env from 'env-var';

// interface Bun.env
declare module 'bun' {
	interface Env {
		PORT: number;
		DOCS_ENABLED: boolean;
		DOCS_PATH: string;
		DOCS_PLAYGROUND_HTTPS: boolean;
		DOCS_PLAYGROUND_DOMAIN: string;
		DOCS_PLAYGROUND_PORT: number;
	}
}

export enum ServerVersion {
	v1 = 1,
	v2 = 2
}

export enum JSPErrorCode {
	unknown = 'jsp.unknown',
	notFound = 'jsp.not_found',
	validation = 'jsp.validation_failed',
	internalServerError = 'jsp.internal_server_error',
	parseFailed = 'jsp.parse_failed',
	inputInvalid = 'jsp.input.invalid',
	documentNotFound = 'jsp.document.not_found',
	documentPasswordNeeded = 'jsp.document.needs_password',
	documentInvalidPasswordLength = 'jsp.document.invalid_password_length',
	documentInvalidPassword = 'jsp.document.invalid_password',
	documentInvalidLength = 'jsp.document.invalid_length',
	documentInvalidSecret = 'jsp.document.invalid_secret',
	documentInvalidSecretLength = 'jsp.document.invalid_secret_length',
	documentInvalidKeyLength = 'jsp.document.invalid_key_length',
	documentKeyAlreadyExists = 'jsp.document.key_already_exists'
}

export const serverConfig: Required<ServerOptions> = {
	port: env.get('PORT').default(4000).asPortNumber(),
	versions: [ServerVersion.v1, ServerVersion.v2],
	docs: {
		enabled: env.get('DOCS_ENABLED').asBoolStrict() ?? true,
		path: env.get('DOCS_PATH').default('/docs').asString(),
		playground: {
			https: env.get('DOCS_PLAYGROUND_HTTPS').asBoolStrict() ?? true,
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
export const viewDocumentPath = process.env['VIEW_DOCUMENTS_PATH'] || 'https://jspaste.eu/';
export const characters = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_';

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
};

// https://github.com/microsoft/TypeScript/issues/43505
export type Range<
	START extends number,
	END extends number,
	ARR extends unknown[] = [],
	ACC extends number = never
> = ARR['length'] extends END
	? ACC | START | END
	: Range<START, END, [...ARR, 1], ARR[START] extends undefined ? ACC : ACC | ARR['length']>;
