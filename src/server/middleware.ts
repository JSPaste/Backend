import { bodyLimit as middlewareBodyLimit } from 'hono/body-limit';
import { errorHandler } from '#server/errorHandler.ts';
import { ErrorCode } from '#type/ErrorHandler.ts';
import { env } from '#util/env.ts';

export const middleware = {
	bodyLimit: (maxSize: number = env.documentMaxSize) => {
		return middlewareBodyLimit({
			maxSize: maxSize * 1024,
			onError: () => {
				throw errorHandler.send(ErrorCode.documentInvalidSize);
			}
		});
	}
} as const;
