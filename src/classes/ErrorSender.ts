import { type Context, error, t } from 'elysia';

interface IError {
	type: 'error';
	message: string;
	errorCode: string;
}

export class ErrorSender {
	context: Context;

	constructor(context: Context) {
		this.context = context;
	}

	static isError(error?: IError) {
		return error?.type === 'error';
	}

	static isElysiaError(err?: any): boolean {
		if (!err) return false;

		return (
			err.response &&
			'type' in (err.response as IError) &&
			(err.response as IError).type === 'error'
		);
	}

	static errorType() {
		return t.Object(
			{
				type: t.String({ description: 'The error type' }),
				message: t.String({ description: 'The error message' }),
				errorCode: t.String({ description: 'The error code' }),
			},
			{ description: 'An object representing an error' },
		);
	}

	sendError(code: number, err: IError) {
		return error(code, err);
	}
}
