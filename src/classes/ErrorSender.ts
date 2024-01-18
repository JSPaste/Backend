import { error, t } from 'elysia';

export interface JSPError {
	type: 'error';
	message: string;
	errorCode: string;
}

export class ErrorSender {
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

	static sendError(code: number, err: JSPError) {
		return error(code, err);
	}
}
