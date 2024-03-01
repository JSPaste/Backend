import { t } from 'elysia';
import { JSPErrorCode, type JSPErrorSchema } from '../types/JSPError.ts';

export class JSPError {
	public static readonly message: Record<JSPErrorCode, JSPErrorSchema> = {
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

	public static readonly schema = t.Object(
		{
			type: t.String({ description: 'The error type' }),
			errorCode: t.String({ description: 'The error code' }),
			message: t.String({ description: 'The error message' })
		},
		{ description: 'An object representing an error' }
	);

	public static send(context: any, code: number, error: JSPErrorSchema): JSPErrorSchema {
		context.status = code;
		return error;
	}
}
