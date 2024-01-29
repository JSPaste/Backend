import { Elysia } from 'elysia';
import type { ServerOptions } from '../interfaces/ServerOptions.ts';
import { JSPErrorCode, defaultServerOptions } from '../utils/constants.ts';
import { cors } from '@elysiajs/cors';
import swagger from '@elysiajs/swagger';
import { join } from 'path';
import { errorSenderPlugin } from '../plugins/errorSender.ts';

export class Server {
	private app: Elysia;
	private readonly serverOptions: ServerOptions;

	public constructor(options: Partial<ServerOptions> = {}) {
		this.serverOptions = { ...defaultServerOptions, ...options };
		this.app = new Elysia();

		// TODO: Specify better CORS headers
		this.app
			.use(
				cors({
					origin:
						process.env.NODE_ENV === 'production'
							? ['jspaste.eu', 'docs.jspaste.eu']
							: 'localhost',
					methods: ['GET', 'POST', 'DELETE', 'HEAD', 'OPTIONS', 'PATCH']
				})
			)
			.use(errorSenderPlugin)
			.onError(({ errorSender, path, set, code, error }) => {
				switch (code) {
					case 'NOT_FOUND':
						console.log(path);

						if (path === '/404') return 'Not found';

						// Redirect to the frontend 404 page
						set.redirect = '/404';

						return;

					case 'VALIDATION':
						return errorSender.sendError(400, {
							type: 'error',
							errorCode: JSPErrorCode.validation,
							message: 'Validation failed, please check our documentation',
							hint: process.env.NODE_ENV === 'production' ? error?.message : error
						});

					case 'INTERNAL_SERVER_ERROR':
						return errorSender.sendError(500, {
							type: 'error',
							errorCode: JSPErrorCode.internalServerError,
							message:
								'Internal server error. Something went wrong, please try again later',
							hint: process.env.NODE_ENV === 'production' ? error?.message : error
						});

					case 'PARSE':
						return errorSender.sendError(400, {
							type: 'error',
							errorCode: JSPErrorCode.parseFailed,
							message: 'Failed to parse the request, please try again later',
							hint: process.env.NODE_ENV === 'production' ? error?.message : error
						});

					default:
						console.error(error);

						return errorSender.sendError(400, {
							type: 'error',
							errorCode: JSPErrorCode.unknown,
							message: 'Unknown error, please try again later'
						});
				}
			});
	}

	public run(): void {
		this.initDocs();
		this.initRoutes();

		this.app.listen(this.serverOptions.port, (server) =>
			console.info('Listening on port', server.port, `-> http://localhost:${server.port}`)
		);
	}

	private initDocs(): void {
		this.app.use(
			swagger({
				documentation: {
					servers: [{ url: this.serverOptions.docsHostname }],
					info: {
						title: 'JSPaste documentation',
						version: this.serverOptions.versions.map((v) => `v${v}`).join(', '),
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
				path: '/docs',
				exclude: ['/docs', '/docs/json', /^\/documents/]
			})
		);
	}

	private initRoutes(): void {
		const root = './src/routes';
		const apiVersions = this.serverOptions.versions.toReversed();

		console.info('Registering routes for', apiVersions.length, 'versions...');

		for (const [i, apiVersion] of apiVersions.entries()) {
			const isLatestVersion = i === 0;
			const routesGlob = new Bun.Glob(`v${apiVersion}/**/*.route.ts`);
			const routesArray = Array.from(routesGlob.scanSync({ cwd: root })).map((route) => {
				try {
					return import.meta.require(join('../routes', route)).default;
				} catch (err) {
					console.error('Unable to import route', err);
					return null;
				}
			});

			for (const resolvedRoute of routesArray) {
				if (!resolvedRoute) continue;

				this.app.group(`/api/v${apiVersion as number}/documents`, (prefix) =>
					prefix.use(resolvedRoute)
				);

				if (isLatestVersion) {
					this.app.group('/documents', (prefix) => prefix.use(resolvedRoute));
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
