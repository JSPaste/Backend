import { type Context, t } from 'elysia';
import { JSPErrorCode } from '../utils/constants.ts';

export interface JSPError {
	type: 'error';
	message: string;
	errorCode: JSPErrorCode;
}

export class ErrorSender {
	private readonly context: Context;

	public constructor(context: Context) {
		this.context = context;
	}

	public static isJSPError(err?: any): err is JSPError {
		return (err as JSPError)?.type === 'error';
	}

	public static errorType() {
		return t.Object(
			{
				type: t.String({ description: 'The error type' }),
				message: t.String({ description: 'The error message' }),
				errorCode: t.String({ description: 'The error code' })
			},
			{ description: 'An object representing an error' }
		);
	}

	public sendError(code: number, err: JSPError): JSPError {
		this.context.set.status = code;
		return err;
	}
}
