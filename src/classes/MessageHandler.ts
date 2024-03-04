import { error, t } from 'elysia';
import { ErrorCode, type Schema } from '../types/MessageHandler.ts';

export class MessageHandler {
	public static readonly schema = t.Object(
		{
			type: t.String({ description: 'The message type' }),
			code: t.Integer({ description: 'The message code' }),
			message: t.String({ description: 'The message description' })
		},
		{ description: 'An object representing a message' }
	);

	private static readonly map: Record<ErrorCode, Schema> = {
		[ErrorCode.unknown]: { type: 'server', httpCode: 500, message: 'Unknown error, please try again later' },
		[ErrorCode.notFound]: {
			httpCode: 404,
			type: 'server',
			message: 'The requested resource does not exist'
		},
		[ErrorCode.validation]: {
			httpCode: 400,
			type: 'server',
			message: 'Validation failed, please check our documentation'
		},
		[ErrorCode.serverError]: {
			httpCode: 500,
			type: 'server',
			message: 'Internal server error. Something went wrong, please try again later'
		},
		[ErrorCode.parseFailed]: {
			httpCode: 400,
			type: 'server',
			message: 'Failed to parse the request, please try again later'
		},
		[ErrorCode.validation_invalid]: {
			httpCode: 400,
			type: 'client',
			message: 'The provided string is not alphanumeric or has an invalid length'
		},
		[ErrorCode.document_NotFound]: {
			httpCode: 404,
			type: 'client',
			message: 'The requested document does not exist'
		},
		[ErrorCode.document_PasswordNeeded]: {
			httpCode: 403,
			type: 'client',
			message: 'This document requires credentials, however none were provided'
		},
		[ErrorCode.document_InvalidPasswordLength]: {
			httpCode: 400,
			type: 'client',
			message: 'The provided password length is invalid'
		},
		[ErrorCode.document_InvalidPassword]: {
			httpCode: 400,
			type: 'client',
			message: 'Invalid credentials provided for the document'
		},
		[ErrorCode.document_InvalidLength]: {
			httpCode: 400,
			type: 'client',
			message: 'The document data length is invalid'
		},
		[ErrorCode.document_InvalidSecret]: {
			httpCode: 400,
			type: 'client',
			message: 'Invalid secret provided'
		},
		[ErrorCode.document_InvalidSecretLength]: {
			httpCode: 400,
			type: 'client',
			message: 'The provided secret length is invalid'
		},
		[ErrorCode.document_InvalidKeyLength]: {
			httpCode: 400,
			type: 'client',
			message: 'The provided key length is invalid'
		},
		[ErrorCode.document_KeyAlreadyExists]: {
			httpCode: 400,
			type: 'client',
			message: 'The provided key already exists'
		}
	};

	public static send(code: ErrorCode): void {
		const { httpCode, type, message } = MessageHandler.map[code];

		throw error(httpCode, { type, code, message });
	}

	public static get(code: ErrorCode): any {
		const { type, message } = MessageHandler.map[code];

		return { type, code, message };
	}
}
