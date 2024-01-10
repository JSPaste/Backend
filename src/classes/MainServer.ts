import { join } from 'path';
import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import swagger from '@elysiajs/swagger';

const apiVersions = [
	/*FIXME: Fix correct order when v2 is finished */ 'v2',
	'v1',
];

export class MainServer {
	app: Elysia;
	port: string | number;

	constructor() {
		this.app = new Elysia();
		this.port = process.env['PORT'] ?? 4000;
	}

	async setup() {
		this.app.use(cors({ methods: ['GET', 'POST', 'DELETE'] })).use(
			swagger({
				documentation: {
					servers: [{ url: 'https://jspaste.eu' }],
					info: {
						title: 'JSPaste documentation',
						version: apiVersions.join(', '),
						description:
							'The JSPaste API documentation. Note that you can use /documents instead of /api/vX/documents to use the latest API version by default.',
						license: {
							name: 'EUPL-1.2-or-later',
							url: 'https://github.com/JSPaste/JSP-Backend/blob/stable/LICENSE',
						},
					},
				},
				swaggerOptions: {
					syntaxHighlight: { activate: true, theme: 'monokai' },
				},
				path: '/docs',
				exclude: ['/docs', '/docs/json', /^\/documents/],
			}),
		);

		const cwd = './src/routes';

		let i = 0;

		for (const apiVersion of apiVersions) {
			const isLatestVersion = i === apiVersions.length - 1;

			const glob = new Bun.Glob(`${apiVersion}/**/*.route.ts`);

			const routes = await Array.fromAsync(glob.scan({ cwd }));

			for (const route of routes) {
				const importedRoute = await import(join('../routes', route))
					.then((m) => m.default)
					.catch((err) =>
						console.error('Unable to import route', err),
					);

				if (importedRoute) {
					this.app.group(
						`/api/${apiVersion}/documents`,
						(groupApp: any) => groupApp.use(importedRoute),
					);

					if (isLatestVersion)
						this.app.group('/documents', (groupApp: any) =>
							groupApp.use(importedRoute),
						);
				}
			}

			console.log(
				'Registered',
				routes.length,
				'routes for API version',
				apiVersion,
			);

			i++;
		}

		console.log('JSP-Backend started.');

		this.listen();
	}

	listen() {
		this.app.listen(this.port, () =>
			console.log('Listening on port', this.port),
		);
	}
}
