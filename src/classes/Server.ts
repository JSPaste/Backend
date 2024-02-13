import { Elysia } from 'elysia';
import type { ServerOptions } from '../interfaces/ServerOptions.ts';
import { JSPErrorCode, JSPErrorMessage, serverConfig } from '../utils/constants.ts';
import swagger from '@elysiajs/swagger';
import { errorSenderPlugin } from '../plugins/errorSender.ts';
import cors from '@elysiajs/cors';
import { IndexV1 } from '../routes/IndexV1.ts';

export class Server {
	private readonly server: Elysia;
	private readonly serverConfig: ServerOptions;

	public constructor(options: Partial<ServerOptions> = {}) {
		this.serverConfig = { ...serverConfig, ...options };
		this.server = this.initServer();
	}

	public get self(): Elysia {
		return this.server;
	}

	private initServer(): Elysia {
		const server = new Elysia();

		this.serverConfig.docs.enabled && this.initDocs(server);
		this.initErrorHandler(server);
		this.initCORS(server);

		// TODO: Only for testing
		new IndexV1(server, '/test').group('/testv1');

		server.listen(this.serverConfig.port, (server) =>
			console.info('Listening on port', server.port, `-> http://localhost:${server.port}`)
		);

		return server;
	}

	private initCORS(server: Elysia): void {
		server.use(
			cors({
				origin: true,
				methods: ['GET', 'POST', 'DELETE', 'HEAD', 'OPTIONS', 'PATCH']
			})
		);
	}

	private initDocs(server: Elysia): void {
		server.use(
			swagger({
				documentation: {
					servers: [
						{
							url: (this.serverConfig.docs.playground.tls ? 'https://' : 'http://').concat(
								this.serverConfig.docs.playground.domain,
								':',
								this.serverConfig.docs.playground.port.toString()
							)
						}
					],
					info: {
						title: 'JSPaste documentation',
						version: this.serverConfig.versions.map((version) => `v${version}`).join(', '),
						description:
							'The JSPaste API documentation. Note that you can use /documents instead of /api/vX/documents to use the latest API version by default.',
						license: {
							name: 'EUPL-1.2',
							url: 'https://raw.githubusercontent.com/JSPaste/JSP-Backend/stable/LICENSE'
						}
					}
				},
				swaggerOptions: {
					syntaxHighlight: { activate: true, theme: 'monokai' }
				},
				path: this.serverConfig.docs.path,
				exclude: [this.serverConfig.docs.path, this.serverConfig.docs.path.concat('/json'), /^\/documents/]
			})
		);
	}

	private initErrorHandler(server: Elysia): void {
		server.use(errorSenderPlugin).onError(({ errorSender, path, set, code, error }) => {
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
