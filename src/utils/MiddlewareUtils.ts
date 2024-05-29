import { bodyLimit as middlewareBodyLimit } from '@hono/hono/body-limit';
import { errorHandler } from '../errorHandler.ts';
import { env } from '../server.ts';
import { ErrorCode } from '../types/ErrorHandler.ts';

export class MiddlewareUtils {
	public static bodyLimit(maxSize: number = env.DOCUMENT_MAXSIZE) {
		return middlewareBodyLimit({
			maxSize: maxSize * 1024,
			onError: () => {
				throw errorHandler.send(ErrorCode.documentInvalidSize);
			}
		});
	}
}
