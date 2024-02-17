import { Elysia } from 'elysia';
import swagger from '@elysiajs/swagger';
import cors from '@elysiajs/cors';
import { IndexV1 } from '../routes/IndexV1.ts';
import { AccessV1 } from '../routes/AccessV1.ts';
import { AccessRawV1 } from '../routes/AccessRawV1.ts';
import { PublishV1 } from '../routes/PublishV1.ts';
import { RemoveV1 } from '../routes/RemoveV1.ts';
import { EditV2 } from '../routes/EditV2.ts';
import { ExistsV2 } from '../routes/ExistsV2.ts';
import { IndexV2 } from '../routes/IndexV2.ts';
import { PublishV2 } from '../routes/PublishV2.ts';
import { RemoveV2 } from '../routes/RemoveV2.ts';
import { AccessV2 } from '../routes/AccessV2.ts';
import { AccessRawV2 } from '../routes/AccessRawV2.ts';
import { type ServerOptions, ServerVersion } from '../types/Server.ts';
import { JSPError } from './JSPError.ts';
import * as env from 'env-var';
import { ErrorCode } from '../types/JSPError.ts';

export class Server {
	public static readonly config: Required<ServerOptions> = {
		tls: env.get('TLS').asBoolStrict() ?? false,
		domain: env.get('DOMAIN').default('localhost').asString(),
		port: env.get('PORT').default(4000).asPortNumber(),
		versions: [ServerVersion.v1, ServerVersion.v2],
		files: {},
		docs: {
			enabled: env.get('DOCS_ENABLED').asBoolStrict() ?? true,
			path: env.get('DOCS_PATH').default('/docs').asString(),
			playground: {
				tls: env.get('DOCS_PLAYGROUND_TLS').asBoolStrict() ?? true,
				domain: env.get('DOCS_PLAYGROUND_DOMAIN').default('jspaste.eu').asString(),
				port: env.get('DOCS_PLAYGROUND_PORT').default(443).asPortNumber()
			}
		},
		zlib: {
			level: 6
		}
	};

	// FIXME(inetol): Migrate to new config system
	public static readonly basePath = process.env['DOCUMENTS_PATH'] || 'documents/';
	public static readonly maxDocLength = parseInt(process.env['MAX_FILE_LENGTH'] || '2000000');
	public static readonly defaultDocumentLifetime = parseInt(process.env['DEFAULT_DOCUMENT_LIFETIME'] || '86400');

	private readonly server: Elysia = this.createServer();

	public get self(): Elysia {
		return this.server;
	}

	private createServer(): Elysia {
		const server = new Elysia();

		this.initCORS(server);
		Server.config.docs.enabled && this.initDocs(server);
		this.initErrorHandling(server);
		this.initRoutes(server);

		server.listen(Server.config.port, (server) =>
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
							url: (Server.config.docs.playground.tls ? 'https://' : 'http://').concat(
								Server.config.docs.playground.domain,
								':',
								Server.config.docs.playground.port.toString()
							)
						}
					],
					info: {
						title: 'JSPaste documentation',
						version: Server.config.versions.map((version) => `v${version}`).join(', '),
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
				path: Server.config.docs.path,
				exclude: [Server.config.docs.path, Server.config.docs.path.concat('/json'), /^\/documents/]
			})
		);
	}

	private initErrorHandling(server: Elysia): void {
		server.onError(({ set, code, error }) => {
			switch (code) {
				case 'NOT_FOUND':
					return 'Not found';

				case 'VALIDATION':
					return JSPError.send(set, 400, JSPError.message[ErrorCode.validation]);

				case 'INTERNAL_SERVER_ERROR':
					console.error(error);
					return JSPError.send(set, 500, JSPError.message[ErrorCode.internalServerError]);

				case 'PARSE':
					return JSPError.send(set, 400, JSPError.message[ErrorCode.parseFailed]);

				default:
					console.error(error);
					return JSPError.send(set, 400, JSPError.message[ErrorCode.unknown]);
			}
		});
	}

	private initRoutes(server: Elysia): void {
		const apiVersions = Server.config.versions.toReversed();
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
