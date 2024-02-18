import { t } from 'elysia';
import { ErrorCode, type ErrorType } from '../types/JSPError.ts';

export class JSPError {
	public static readonly message: Record<ErrorCode, ErrorType> = {
		[ErrorCode.unknown]: {
			type: 'error',
			errorCode: ErrorCode.unknown,
			message: 'Unknown error, please try again later'
		},
		[ErrorCode.notFound]: {
			type: 'error',
			errorCode: ErrorCode.notFound,
			message: 'The requested resource does not exist'
		},
		[ErrorCode.validation]: {
			type: 'error',
			errorCode: ErrorCode.validation,
			message: 'Validation failed, please check our documentation'
		},
		[ErrorCode.internalServerError]: {
			type: 'error',
			errorCode: ErrorCode.internalServerError,
			message: 'Internal server error. Something went wrong, please try again later'
		},
		[ErrorCode.parseFailed]: {
			type: 'error',
			errorCode: ErrorCode.parseFailed,
			message: 'Failed to parse the request, please try again later'
		},
		[ErrorCode.inputInvalid]: {
			type: 'error',
			errorCode: ErrorCode.inputInvalid,
			message: 'The provided document key is not alphanumeric or has an invalid length'
		},
		[ErrorCode.documentNotFound]: {
			type: 'error',
			errorCode: ErrorCode.documentNotFound,
			message: 'The requested document does not exist'
		},
		[ErrorCode.documentPasswordNeeded]: {
			type: 'error',
			errorCode: ErrorCode.documentPasswordNeeded,
			message: 'This document requires credentials, however none were provided.'
		},
		[ErrorCode.documentInvalidPasswordLength]: {
			type: 'error',
			errorCode: ErrorCode.documentInvalidPasswordLength,
			message: 'The provided password length is invalid'
		},
		[ErrorCode.documentInvalidPassword]: {
			type: 'error',
			errorCode: ErrorCode.documentInvalidPassword,
			message: 'Invalid credentials provided for the document.'
		},
		[ErrorCode.documentInvalidLength]: {
			type: 'error',
			errorCode: ErrorCode.documentInvalidLength,
			message: 'The document data length is invalid'
		},
		[ErrorCode.documentInvalidSecret]: {
			type: 'error',
			errorCode: ErrorCode.documentInvalidSecret,
			message: 'Invalid secret provided'
		},
		[ErrorCode.documentInvalidSecretLength]: {
			type: 'error',
			errorCode: ErrorCode.documentInvalidSecretLength,
			message: 'The provided secret length is invalid'
		},
		[ErrorCode.documentInvalidKeyLength]: {
			type: 'error',
			errorCode: ErrorCode.documentInvalidKeyLength,
			message: 'The provided key length is invalid'
		},
		[ErrorCode.documentKeyAlreadyExists]: {
			type: 'error',
			errorCode: ErrorCode.documentKeyAlreadyExists,
			message: 'The provided key already exists'
		}
	};

	public static readonly schema = t.Object(
		{
			type: t.String({ description: 'The error type' }),
			message: t.String({ description: 'The error message' }),
			errorCode: t.String({ description: 'The error code' })
		},
		{ description: 'An object representing an error' }
	);

	public static send(context: any, code: number, error: ErrorType): ErrorType {
		context.status = code;
		return error;
	}
}
