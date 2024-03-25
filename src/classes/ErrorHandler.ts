import { error, t } from 'elysia';
import { ErrorCode, type Schema } from '../types/ErrorHandler.ts';

export class ErrorHandler {
	public static readonly SCHEMA = t.Object(
		{
			type: t.String({ description: 'The message type' }),
			code: t.Integer({ description: 'The message code' }),
			message: t.String({ description: 'The message description' })
		},
		{ description: 'An object representing a message' }
	);

	private static readonly MAP: Record<ErrorCode, Schema> = {
		[ErrorCode.unknown]: {
			type: 'internal',
			httpCode: 500,
			message: 'Unknown error, please try again later'
		},
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
		[ErrorCode.validationInvalid]: {
			httpCode: 400,
			type: 'validation',
			message: 'The provided string is not alphanumeric or has an invalid length'
		},
		[ErrorCode.documentNotFound]: {
			httpCode: 404,
			type: 'document',
			message: 'The requested document does not exist'
		},
		[ErrorCode.documentPasswordNeeded]: {
			httpCode: 403,
			type: 'document',
			message: 'This document requires credentials, however none were provided'
		},
		[ErrorCode.documentInvalidPasswordLength]: {
			httpCode: 400,
			type: 'document',
			message: 'The provided password length is invalid'
		},
		[ErrorCode.documentInvalidPassword]: {
			httpCode: 400,
			type: 'document',
			message: 'Invalid credentials provided for the document'
		},
		[ErrorCode.documentInvalidLength]: {
			httpCode: 400,
			type: 'document',
			message: 'The document data length is invalid'
		},
		[ErrorCode.documentInvalidSecret]: {
			httpCode: 400,
			type: 'document',
			message: 'Invalid secret provided'
		},
		[ErrorCode.documentInvalidSecretLength]: {
			httpCode: 400,
			type: 'document',
			message: 'The provided secret length is invalid'
		},
		[ErrorCode.documentInvalidKeyLength]: {
			httpCode: 400,
			type: 'document',
			message: 'The provided key length is invalid'
		},
		[ErrorCode.documentKeyAlreadyExists]: {
			httpCode: 400,
			type: 'document',
			message: 'The provided key already exists'
		}
	};

	public static get(code: ErrorCode) {
		const { type, message } = ErrorHandler.MAP[code];

		return { type, code, message };
	}

	public static send(code: ErrorCode): void {
		const { httpCode, type, message } = ErrorHandler.MAP[code];

		throw error(httpCode, { type, code, message });
	}
}
