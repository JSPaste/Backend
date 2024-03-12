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
import { DocumentHandler } from './DocumentHandler.ts';
import { ErrorHandler } from './ErrorHandler.ts';

export class Server {
	public static readonly TLS = env.get('TLS').asBoolStrict() ?? false;
	public static readonly DOMAIN = env.get('DOMAIN').default('localhost').asString();
	public static readonly HOSTNAME = (Server.TLS ? 'https://' : 'http://').concat(Server.DOMAIN);
	public static readonly PORT = env.get('PORT').default(4000).asPortNumber();
	public static readonly ENDPOINT_VERSIONS = [ServerEndpointVersion.V1, ServerEndpointVersion.V2];
	public static readonly DOCUMENT_KEY_LENGTH_MIN = 2;
	public static readonly DOCUMENT_KEY_LENGTH_MAX = 32;
	public static readonly DOCUMENT_KEY_LENGTH_DEFAULT = 8;
	public static readonly DOCUMENT_PATH = 'documents/';
	public static readonly DOCUMENT_MAX_LENGTH = env.get('DOCUMENTS_MAXLENGTH').default(2000000).asIntPositive();
	public static readonly DOCUMENT_MAX_TIME = env.get('DOCUMENTS_MAXTIME').default(86400).asIntPositive();
	public static readonly DOCS_ENABLED = env.get('DOCS_ENABLED').asBoolStrict() ?? true;
	public static readonly DOCS_PATH = env.get('DOCS_PATH').default('/docs').asString();
	public static readonly ZLIB_LEVEL = 6;

	private readonly ELYSIA: Elysia = new Elysia({ precompile: true });
	private readonly DOCUMENT_HANDLER: DocumentHandler = new DocumentHandler();

	public constructor() {
		Server.DOCS_ENABLED && this.initDocs();
		this.initRequestListener();
		this.initErrorListener();
		this.initEndpoints();

		this.ELYSIA.listen(Server.PORT, ({ port }) => console.info(`Listening on: http://localhost:${port}`));
	}

	public get elysia(): Elysia {
		return this.ELYSIA;
	}

	public get documentHandler(): DocumentHandler {
		return this.DOCUMENT_HANDLER;
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
							url: 'http://localhost:'.concat(Server.PORT.toString()),
							description: 'Local API (Only use if you are running an instance locally)'
						}
					],
					info: {
						title: 'JSPaste documentation',
						version: Server.ENDPOINT_VERSIONS.map((version) => `V${version}`).join(', '),
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
				path: Server.DOCS_PATH,
				exclude: [Server.DOCS_PATH, Server.DOCS_PATH.concat('/json'), /^\/documents/]
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

		for (const [i, version] of Server.ENDPOINT_VERSIONS.toReversed().entries()) {
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
