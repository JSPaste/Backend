import swagger from '@elysiajs/swagger';
import { Elysia } from 'elysia';
import * as env from 'env-var';
import { AccessV1 } from '../endpoints/AccessV1.ts';
import { AccessV2 } from '../endpoints/AccessV2.ts';
import { EditV2 } from '../endpoints/EditV2.ts';
import { ExistsV2 } from '../endpoints/ExistsV2.ts';
import { IndexV1 } from '../endpoints/IndexV1.ts';
import { IndexV2 } from '../endpoints/IndexV2.ts';
import { PublishV1 } from '../endpoints/PublishV1.ts';
import { PublishV2 } from '../endpoints/PublishV2.ts';
import { RemoveV1 } from '../endpoints/RemoveV1.ts';
import { RemoveV2 } from '../endpoints/RemoveV2.ts';
import { type ServerConfig, ServerEndpointVersion } from '../types/Server.ts';
import { DocumentHandler } from './DocumentHandler.ts';

export class Server {
	public static readonly config: Required<ServerConfig> = {
		tls: env.get('TLS').asBoolStrict() ?? false,
		domain: env.get('DOMAIN').default('localhost').asString(),
		port: env.get('PORT').default(4000).asPortNumber(),
		versions: [ServerEndpointVersion.v1, ServerEndpointVersion.v2],
		documents: {
			defaultKeyLength: 8,
			documentPath: 'documents/',
			maxLength: env.get('DOCUMENTS_MAXLENGTH').default(2000000).asIntPositive(),
			maxTime: env.get('DOCUMENTS_MAXTIME').default(86400).asIntPositive()
		},
		docs: {
			enabled: env.get('DOCS_ENABLED').asBoolStrict() ?? true,
			path: env.get('DOCS_PATH').default('/docs').asString()
		},
		zlib: {
			level: 6
		}
	};

	public static readonly hostname = (Server.config.tls ? 'https://' : 'http://').concat(Server.config.domain);

	private readonly elysia: Elysia = new Elysia({ precompile: true });
	private readonly documentHandler: DocumentHandler = new DocumentHandler();

	public constructor() {
		Server.config.docs.enabled && this.initDocs();
		// FIXME: When error is thrown, it will get into default case
		//this.initErrorListener();
		this.initEndpoints();

		this.elysia.listen(Server.config.port, ({ port }) =>
			console.info('Listening on port', port, `-> http://localhost:${port}`)
		);
	}

	public get getElysia(): Elysia {
		return this.elysia;
	}

	public get getDocumentHandler(): DocumentHandler {
		return this.documentHandler;
	}

	private initDocs(): void {
		this.elysia.use(
			swagger({
				documentation: {
					servers: [
						{
							url: 'https://jspaste.eu',
							description: 'JSPaste API'
						},
						{
							url: 'http://localhost:'.concat(Server.config.port.toString()),
							description: 'Instance local API (Only use if you are running an instance locally)'
						}
					],
					info: {
						title: 'JSPaste documentation',
						version: Server.config.versions.map((version) => `V${version}`).join(', '),
						description: 'Note: The latest API version can be used with the "/documents" alias route.',
						license: {
							name: 'EUPL-1.2',
							url: 'https://joinup.ec.europa.eu/sites/default/files/custom-page/attachment/2020-03/EUPL-1.2%20EN.txt'
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

	/*
	private initErrorListener(): void {
		this.elysia.onError(({ set, code, error }) => {
			switch (code) {
				case 'NOT_FOUND':
					return '';

				case 'VALIDATION':
					return JSPError.send(set, 400, JSPError.message[JSPErrorCode.validation]);

				case 'INTERNAL_SERVER_ERROR':
					console.error(error);
					return JSPError.send(set, 500, JSPError.message[JSPErrorCode.internalServerError]);

				case 'PARSE':
					return JSPError.send(set, 400, JSPError.message[JSPErrorCode.parseFailed]);

				default:
					console.error(error);
					return JSPError.send(set, 500, JSPError.message[JSPErrorCode.unknown]);
			}
		});
	}
	*/

	private initEndpoints(): void {
		const routes = {
			[ServerEndpointVersion.v1]: {
				endpoints: [new AccessV1(this), new IndexV1(this), new PublishV1(this), new RemoveV1(this)],
				prefixes: ['/api/v1/documents']
			},
			[ServerEndpointVersion.v2]: {
				endpoints: [
					new AccessV2(this),
					new EditV2(this),
					new ExistsV2(this),
					new IndexV2(this),
					new PublishV2(this),
					new RemoveV2(this)
				],
				prefixes: ['/api/v2/documents', '/documents']
			}
		};

		for (const [i, version] of Server.config.versions.toReversed().entries()) {
			for (const endpoint of routes[version].endpoints) {
				for (const prefix of routes[version].prefixes) endpoint.setPrefix(prefix).register();
			}

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
