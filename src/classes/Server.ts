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
		this.app.use(cors({ methods: ['GET', 'POST', 'DELETE'] }));
	}

	public async run(): Promise<void> {
		this.initDocs();
		await this.initAsyncRoutes();

		this.app.listen(this.serverOptions.port, () =>
			console.log('Listening on port', this.serverOptions.port)
		);
	}

	private initDocs(): void {
		this.app.use(
			swagger({
				documentation: {
					servers: [{ url: this.serverOptions.hostname }],
					info: {
						title: 'JSPaste documentation',
						version: this.serverOptions.versions.join(', '),
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

	// FIXME: Sync load
	private async initAsyncRoutes(): Promise<void> {
		const root = './src/routes';
		let i = 0;

		for (const apiVersion of this.serverOptions.versions) {
			const isLatestVersion = i === this.serverOptions.versions.length - 1;
			const glob = new Bun.Glob(`${apiVersion}/**/*.route.ts`);
			const routes = await Array.fromAsync(glob.scan({ cwd: root }));

			for (const route of routes) {
				const importedRoute = await import(join('../routes', route))
					.then((m) => m.default)
					.catch((err) => console.error('Unable to import route', err));

				if (importedRoute) {
					this.app.group(`/api/${apiVersion}/documents`, (groupApp: any) =>
						groupApp.use(importedRoute)
					);

					if (isLatestVersion)
						this.app.group('/documents', (groupApp: any) =>
							groupApp.use(importedRoute)
						);
				}
			}

			console.info('Registered', routes.length, 'routes for API version', apiVersion);
			i++;
		}
	}
}
