import { error, t } from 'elysia';
import { ErrorCode, type Schema } from '../types/ErrorHandler.ts';

export class ErrorHandler {
	public static readonly schema = t.Object(
		{
			type: t.String({ description: 'The message type' }),
			code: t.Integer({ description: 'The message code' }),
			message: t.String({ description: 'The message description' })
		},
		{ description: 'An object representing a message' }
	);

	private static readonly map: Record<ErrorCode, Schema> = {
		[ErrorCode.unknown]: { type: 'internal', httpCode: 500, message: 'Unknown error, please try again later' },
		[ErrorCode.notFound]: {
			httpCode: 404,
			type: 'internal',
			message: 'The requested resource does not exist'
		},
		[ErrorCode.validation]: {
			httpCode: 400,
			type: 'internal',
			message: 'Validation failed, please check our documentation'
		},
		[ErrorCode.crash]: {
			httpCode: 500,
			type: 'internal',
			message: 'Internal server error. Something went wrong, please try again later'
		},
		[ErrorCode.parse]: {
			httpCode: 400,
			type: 'internal',
			message: 'Failed to parse the request, please try again later'
		},
		[ErrorCode.validation_invalid]: {
			httpCode: 400,
			type: 'validation',
			message: 'The provided string is not alphanumeric or has an invalid length'
		},
		[ErrorCode.document_NotFound]: {
			httpCode: 404,
			type: 'document',
			message: 'The requested document does not exist'
		},
		[ErrorCode.document_PasswordNeeded]: {
			httpCode: 403,
			type: 'document',
			message: 'This document requires credentials, however none were provided'
		},
		[ErrorCode.document_InvalidPasswordLength]: {
			httpCode: 400,
			type: 'document',
			message: 'The provided password length is invalid'
		},
		[ErrorCode.document_InvalidPassword]: {
			httpCode: 400,
			type: 'document',
			message: 'Invalid credentials provided for the document'
		},
		[ErrorCode.document_InvalidLength]: {
			httpCode: 400,
			type: 'document',
			message: 'The document data length is invalid'
		},
		[ErrorCode.document_InvalidSecret]: {
			httpCode: 400,
			type: 'document',
			message: 'Invalid secret provided'
		},
		[ErrorCode.document_InvalidSecretLength]: {
			httpCode: 400,
			type: 'document',
			message: 'The provided secret length is invalid'
		},
		[ErrorCode.document_InvalidKeyLength]: {
			httpCode: 400,
			type: 'document',
			message: 'The provided key length is invalid'
		},
		[ErrorCode.document_KeyAlreadyExists]: {
			httpCode: 400,
			type: 'document',
			message: 'The provided key already exists'
		}
	};

	public static send(code: ErrorCode): void {
		const { httpCode, type, message } = ErrorHandler.map[code];

		throw error(httpCode, { type, code, message });
	}

	public static get(code: ErrorCode) {
		const { type, message } = ErrorHandler.map[code];

		return { type, code, message };
	}
}
