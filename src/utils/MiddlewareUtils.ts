import { bodyLimit as middlewareBodyLimit } from '@hono/hono/body-limit';
import { ENV } from '../classes/ENV.ts';
import { ErrorHandler } from '../classes/ErrorHandler.ts';
import { ErrorCode } from '../types/ErrorHandler.ts';

export class MiddlewareUtils {
	public static bodyLimit(maxSize: number = ENV.DOCUMENT_MAXSIZE) {
		return middlewareBodyLimit({
			maxSize: maxSize * 1024,
			onError: () => {
				throw ErrorHandler.send(ErrorCode.documentInvalidSize);
			}
		});
	}
}
