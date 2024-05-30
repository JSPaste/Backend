import { apiReference } from '@scalar/hono-api-reference';
import { bodyLimit as middlewareBodyLimit } from 'hono/body-limit';
import { errorHandler } from './errorHandler.ts';
import { config, env } from './server.ts';
import { ErrorCode } from './types/ErrorHandler.ts';

export const middleware = {
	bodyLimit: (maxSize: number = env.DOCUMENT_MAXSIZE) => {
		return middlewareBodyLimit({
			maxSize: maxSize * 1024,
			onError: () => {
				throw errorHandler.send(ErrorCode.documentInvalidSize);
			}
		});
	},

	scalar: () => {
		return apiReference({
			pageTitle: 'JSPaste Documentation',
			theme: 'saturn',
			layout: 'classic',
			isEditable: false,
			spec: {
				url: config.PATH.concat('/oas.json')
			}
		});
	}
} as const;
