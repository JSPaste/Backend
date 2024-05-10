import { bodyLimit as middlewareBodyLimit } from 'hono/body-limit';
import { ErrorHandler } from '../classes/ErrorHandler.ts';
import { Server } from '../classes/Server.ts';
import { ErrorCode } from '../types/ErrorHandler.ts';

export class MiddlewareUtils {
	public static bodyLimit(maxSize: number = Server.DOCUMENT_MAXSIZE) {
		return middlewareBodyLimit({
			maxSize: maxSize * 1024,
			onError: () => {
				throw ErrorHandler.send(ErrorCode.documentInvalidSize);
			}
		});
	}
}
