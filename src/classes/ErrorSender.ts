import { t, type Context } from 'elysia';
import { JSPErrorCode } from '../utils/constants';

export interface JSPError {
	type: 'error';
	message: string;
	errorCode: JSPErrorCode;
}

export class ErrorSender {
	context: Context;

	constructor(context: Context) {
		this.context = context;
	}

	static isJSPError(error?: any) {
		return error?.type === 'error';
	}

	static isElysiaError(err?: any): boolean {
		if (!err) return false;

		return (
			err.response &&
			'type' in (err.response as JSPError) &&
			(err.response as JSPError).type === 'error'
		);
	}

	static errorType() {
		return t.Object(
			{
				type: t.String({ description: 'The error type' }),
				message: t.String({ description: 'The error message' }),
				errorCode: t.String({ description: 'The error code' })
			},
			{ description: 'An object representing an error' }
		);
	}

	sendError(code: number, err: JSPError) {
		this.context.set.status = code;

		return err;
	}
}
