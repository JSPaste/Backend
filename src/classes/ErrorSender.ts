import { type Context, t } from 'elysia';
import { JSPErrorCode } from '../utils/constants';

export interface JSPError {
	type: 'error';
	message: string;
	errorCode: JSPErrorCode;
	hint?: any;
}

export class ErrorSender {
	context: Context;

	constructor(context: Context) {
		this.context = context;
	}

	static isJSPError(err?: any): err is JSPError {
		return (err as JSPError).type === 'error';
	}

	static errorType() {
		return t.Object(
			{
				type: t.String({ description: 'The error type' }),
				message: t.String({ description: 'The error message' }),
				errorCode: t.String({ description: 'The error code' }),
				hint: t.Optional(t.Any({ description: 'The error hint' }))
			},
			{ description: 'An object representing an error' }
		);
	}

	sendError(code: number, err: JSPError) {
		this.context.set.status = code;

		return err;
	}
}
