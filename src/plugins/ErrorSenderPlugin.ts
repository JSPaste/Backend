import Elysia from 'elysia';
import { ErrorSender } from '../classes/ErrorSender.ts';
import { AbstractPlugin } from '../classes/AbstractPlugin.ts';
import { JSPErrorCode, JSPErrorMessage } from '../utils/constants.ts';

export class ErrorSenderPlugin extends AbstractPlugin {
	public constructor(server: Elysia) {
		super(server);
	}

	public override load(): Elysia {
		return this.server
			.derive((context) => {
				return {
					errorSender: new ErrorSender(context)
				};
			})
			.onError(({ errorSender, path, set, code, error }) => {
				switch (code) {
					// Redirect to the frontend 404 page
					case 'NOT_FOUND':
						if (path === '/404') return 'Not found';
						set.redirect = '/404';
						return;

					case 'VALIDATION':
						console.error(error);
						return errorSender.sendError(400, JSPErrorMessage[JSPErrorCode.validation]);

					case 'INTERNAL_SERVER_ERROR':
						console.error(error);
						return errorSender.sendError(500, JSPErrorMessage[JSPErrorCode.internalServerError]);

					case 'PARSE':
						console.error(error);
						return errorSender.sendError(400, JSPErrorMessage[JSPErrorCode.parseFailed]);

					default:
						console.error(error);
						return errorSender.sendError(400, JSPErrorMessage[JSPErrorCode.unknown]);
				}
			});
	}
}
