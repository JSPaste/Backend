import type { JSPError } from '../types/ErrorHandler.ts';

export class ErrorHandler {
	public static send(context: any, code: number, error: JSPError) {
		context.status = code;
		return error;
	}

	public static isJSPError(res: any): res is JSPError {
		return res.error !== undefined;
	}
}
