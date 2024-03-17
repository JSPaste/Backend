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
import { ErrorCode } from '../types/ErrorHandler.ts';
import { ServerEndpointVersion } from '../types/Server.ts';
import { ErrorHandler } from './ErrorHandler.ts';

export class Server {
	public static readonly ENV = {
		PORT: env.get('PORT').default(4000).asPortNumber(),
		DOCUMENT_TLS: env.get('DOCUMENT_TLS').asBoolStrict() ?? false,
		DOCUMENT_DOMAIN: env.get('DOCUMENT_DOMAIN').default('localhost').asString(),
		DOCUMENT_MAXLENGTH: env.get('DOCUMENT_MAXLENGTH').default(2000000).asIntPositive(),
		DOCUMENT_MAXTIME: env.get('DOCUMENT_MAXTIME').default(86400).asIntPositive(),
		DOCS_ENABLED: env.get('DOCS_ENABLED').asBoolStrict() ?? false,
		DOCS_PATH: env.get('DOCS_PATH').default('/docs').asString()
	};

	public static readonly CONFIG = {
		HOSTNAME: (Server.ENV.DOCUMENT_TLS ? 'https://' : 'http://').concat(Server.ENV.DOCUMENT_DOMAIN),
		ENDPOINT_VERSIONS: [ServerEndpointVersion.V1, ServerEndpointVersion.V2],
		DOCUMENT_PATH: 'documents/',
		DOCUMENT_KEY_LENGTH_MIN: 2,
		DOCUMENT_KEY_LENGTH_MAX: 32,
		DOCUMENT_KEY_LENGTH_DEFAULT: 8
	};

	private readonly ELYSIA: Elysia = new Elysia({ precompile: true });

	public constructor() {
		Server.ENV.DOCS_ENABLED && this.initDocs();
		this.initRequestListener();
		this.initErrorListener();
		this.initEndpoints();

		this.ELYSIA.listen(Server.ENV.PORT, ({ port }) => console.info(`Listening on: http://localhost:${port}`));
	}

	public get elysia(): Elysia {
		return this.ELYSIA;
	}

	private initDocs(): void {
		this.ELYSIA.use(
			swagger({
				documentation: {
					servers: [
						{
							url: 'https://jspaste.eu',
							description: 'JSPaste API'
						},
						{
							url: 'http://localhost:'.concat(Server.ENV.PORT.toString()),
							description: 'Local API (Only use if you are running an instance locally)'
						}
					],
					info: {
						title: 'JSPaste documentation',
						version: Server.CONFIG.ENDPOINT_VERSIONS.map((version) => `V${version}`).join(', '),
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
				path: Server.ENV.DOCS_PATH,
				exclude: [Server.ENV.DOCS_PATH, Server.ENV.DOCS_PATH.concat('/json'), /^\/documents/]
			})
		);
	}

	private initRequestListener(): void {
		this.ELYSIA.onRequest(({ set }) => {
			set.headers['Access-Control-Allow-Origin'] = '*';
		});
	}

	private initErrorListener(): void {
		this.ELYSIA.onError(({ code, error }) => {
			switch (code) {
				case 'VALIDATION': {
					return ErrorHandler.get(ErrorCode.validation);
				}

				case 'NOT_FOUND': {
					return '';
				}

				case 'PARSE': {
					return ErrorHandler.get(ErrorCode.parse);
				}

				case 'INTERNAL_SERVER_ERROR': {
					console.error(error);
					return ErrorHandler.get(ErrorCode.crash);
				}

				default: {
					return error;
				}
			}
		});
	}

	private initEndpoints(): void {
		const routes = {
			[ServerEndpointVersion.V1]: {
				endpoints: [new AccessV1(this), new IndexV1(this), new PublishV1(this), new RemoveV1(this)],
				prefixes: ['/api/v1/documents']
			},
			[ServerEndpointVersion.V2]: {
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

		for (const [i, version] of Server.CONFIG.ENDPOINT_VERSIONS.toReversed().entries()) {
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
