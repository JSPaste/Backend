import { Elysia } from 'elysia';
import type { ServerOptions } from '../interfaces/ServerOptions.ts';
import { defaultServerOptions } from '../utils/constants.ts';
import { cors } from '@elysiajs/cors';
import swagger from '@elysiajs/swagger';
import { join } from 'path';

export class Server {
	private app: Elysia;
	private readonly serverOptions: ServerOptions;

	public constructor(options: Partial<ServerOptions> = {}) {
		this.serverOptions = { ...defaultServerOptions, ...options };
		this.app = new Elysia();

		// TODO: Specify better CORS headers
		this.app.use(
			cors({
				origin:
					process.env.NODE_ENV === 'production'
						? ['jspaste.eu', 'docs.jspaste.eu']
						: 'localhost',
				methods: ['GET', 'POST', 'DELETE', 'HEAD', 'OPTIONS', 'PATCH']
			})
		);
	}

	public run(): void {
		this.initDocs();
		this.initRoutes();

		this.app.listen(this.serverOptions.port, (server) =>
			console.info('Listening on port', server.port)
		);
	}

	private initDocs(): void {
		this.app.use(
			swagger({
				documentation: {
					servers: [{ url: this.serverOptions.hostname }],
					info: {
						title: 'JSPaste documentation',
						version: this.serverOptions.versions.map((v) => `v${v}`).join(', '),
						description:
							'The JSPaste API documentation. Note that you can use /documents instead of /api/vX/documents to use the latest API version by default.',
						license: {
							name: 'EUPL-1.2-or-later',
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
			const isLatestVersion = i === apiVersions.length - 1;
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

				this.app.group(`/api/v${apiVersion}/documents`, (prefix) =>
					prefix.use(resolvedRoute)
				);

				if (isLatestVersion) {
					this.app.group('/documents', (prefix) => prefix.use(resolvedRoute));
				}
			}

			console.info('Registered', routesArray.length, 'routes for API version', apiVersion);
		}
	}
}
