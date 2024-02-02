import { Elysia } from 'elysia';
import type { ServerOptions } from '../interfaces/ServerOptions.ts';
import { JSPErrorMessage, serverConfig } from '../utils/constants.ts';
import swagger from '@elysiajs/swagger';
import { join } from 'path';
import { errorSenderPlugin } from '../plugins/errorSender.ts';
import cors from '@elysiajs/cors';

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
		this.initRoutes(server);
		this.initCORS(server);

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
						{ url: `${this.serverConfig.docs.playground.domain}:${this.serverConfig.docs.playground.port}` }
					],
					info: {
						title: 'JSPaste documentation',
						version: this.serverConfig.versions.map((v) => `v${v}`).join(', '),
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
				exclude: [this.serverConfig.docs.path, `${this.serverConfig.docs.path}/json`, /^\/documents/]
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
					return errorSender.sendError(400, JSPErrorMessage['jsp.validation_failed']);

				case 'INTERNAL_SERVER_ERROR':
					console.error(error);
					return errorSender.sendError(500, JSPErrorMessage['jsp.internal_server_error']);

				case 'PARSE':
					console.error(error);
					return errorSender.sendError(400, JSPErrorMessage['jsp.parse_failed']);

				default:
					console.error(error);
					return errorSender.sendError(400, JSPErrorMessage['jsp.unknown']);
			}
		});
	}

	private initRoutes(server: Elysia): void {
		const routes = './src/routes';
		const apiVersions = this.serverConfig.versions.toReversed();

		console.info('Registering routes for', apiVersions.length, 'versions...');

		for (const [i, apiVersion] of apiVersions.entries()) {
			const isLatestVersion = i === 0;
			const routesGlob = new Bun.Glob(`v${apiVersion}/**/*.route.ts`);
			const routesArray = Array.from(routesGlob.scanSync({ cwd: routes })).map((route) => {
				try {
					return require(join('../routes', route)).default;
				} catch (err) {
					console.error('Unable to import route', err);
					return null;
				}
			});

			for (const resolvedRoute of routesArray) {
				if (!resolvedRoute) continue;

				server.group(`/api/v${apiVersion as number}/documents`, (prefix) => prefix.use(resolvedRoute));

				if (isLatestVersion) {
					server.group('/documents', (prefix) => prefix.use(resolvedRoute));
				}
			}

			console.info(
				'Registered',
				routesArray.length,
				'routes for API version',
				apiVersion,
				isLatestVersion ? '(latest)' : ''
			);
		}
	}
}
