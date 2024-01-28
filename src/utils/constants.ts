import type { ServerOptions } from '../interfaces/ServerOptions.ts';

export enum APIVersions {
	v1 = 1,
	v2 = 2
}

export const defaultServerOptions: ServerOptions = {
	docsHostname: process.env['HOSTNAME'] || 'https://jspaste.eu',
	port: process.env['PORT'] ?? 4000,
	versions: [APIVersions.v1, APIVersions.v2]
} as const satisfies Required<ServerOptions>;

// TODO: Move to Server as static?
export const basePath = process.env['DOCUMENTS_PATH'] || 'documents/';
export const maxDocLength = parseInt(process.env['MAX_FILE_LENGTH'] || '2000000');
export const defaultDocumentLifetime = parseInt(
	process.env['DEFAULT_DOCUMENT_LIFETIME'] || '86400'
);
export const viewDocumentPath = process.env['VIEW_DOCUMENTS_PATH'] || 'https://jspaste.eu/';

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
	documentInvalidSecretLength = 'jsp.document.invalid_secret_length'
}
