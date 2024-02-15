import { Elysia } from 'elysia';
import type { ServerOptions } from '../interfaces/ServerOptions.ts';
import { serverConfig, ServerVersion } from '../utils/constants.ts';
import swagger from '@elysiajs/swagger';
import cors from '@elysiajs/cors';
import { IndexV1 } from '../routes/IndexV1.ts';
import { AccessV1 } from '../routes/AccessV1.ts';
import { AccessRawV1 } from '../routes/AccessRawV1.ts';
import { PublishV1 } from '../routes/PublishV1.ts';
import { RemoveV1 } from '../routes/RemoveV1.ts';
import { ErrorSenderPlugin } from '../plugins/ErrorSenderPlugin.ts';
import { EditV2 } from '../routes/EditV2.ts';
import { ExistsV2 } from '../routes/ExistsV2.ts';
import { IndexV2 } from '../routes/IndexV2.ts';
import { PublishV2 } from '../routes/PublishV2.ts';
import { RemoveV2 } from '../routes/RemoveV2.ts';
import { AccessV2 } from '../routes/AccessV2.ts';
import { AccessRawV2 } from '../routes/AccessRawV2.ts';

export class Server {
	private readonly server: Elysia;
	private readonly serverConfig: ServerOptions;

	public constructor(options: Partial<ServerOptions> = {}) {
		this.serverConfig = { ...serverConfig, ...options };
		this.server = this.createServer();
	}

	public get self(): Elysia {
		return this.server;
	}

	private createServer(): Elysia {
		const server = new Elysia();

		this.initCORS(server);
		this.serverConfig.docs.enabled && this.initDocs(server);
		this.initPlugins(server);
		this.initRoutes(server);

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

	private initPlugins(server: Elysia): void {
		const plugins = [ErrorSenderPlugin];

		plugins.forEach((Plugin) => server.use(new Plugin(server).load()));
	}

	private initRoutes(server: Elysia): void {
		const apiVersions = this.serverConfig.versions.toReversed();
		const routes = {
			[ServerVersion.v1]: {
				endpoints: [AccessRawV1, AccessV1, IndexV1, PublishV1, RemoveV1],
				prefixes: ['/api/v1/documents']
			},
			[ServerVersion.v2]: {
				endpoints: [AccessRawV2, AccessV2, EditV2, ExistsV2, IndexV2, PublishV2, RemoveV2],
				prefixes: ['/api/v2/documents', '/documents']
			}
		};

		for (const [i, version] of apiVersions.entries()) {
			routes[version].endpoints.forEach((Endpoint) => {
				const endpoint = new Endpoint(server);

				routes[version].prefixes.forEach(endpoint.register.bind(endpoint));
			});

			console.info(
				'Registered',
				routes[version].endpoints.length,
				'routes for version',
				version,
				i === 0 ? '(latest)' : ''
			);
		}
	}
}
