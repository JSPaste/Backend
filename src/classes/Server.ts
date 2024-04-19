import { Database } from 'bun:sqlite';
import swagger from '@elysiajs/swagger';
import { Elysia } from 'elysia';
import * as env from 'env-var';
import { AccessRawV1 } from '../endpoints/AccessRawV1.ts';
import { AccessRawV2 } from '../endpoints/AccessRawV2.ts';
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
	// ENV
	public static readonly PORT = env.get('PORT').default(4000).asPortNumber();
	public static readonly DOCUMENT_TLS = env.get('DOCUMENT_TLS').asBoolStrict() ?? false;
	public static readonly DOCUMENT_DOMAIN = env.get('DOCUMENT_DOMAIN').default('localhost').asString();
	public static readonly DOCUMENT_MAXLENGTH = env.get('DOCUMENT_MAXLENGTH').default(2000000).asIntPositive();
	public static readonly DOCS_ENABLED = env.get('DOCS_ENABLED').asBoolStrict() ?? false;
	public static readonly DOCS_PATH = env.get('DOCS_PATH').default('/docs').asString();

	// CONFIG
	public static readonly HOSTNAME = (Server.DOCUMENT_TLS ? 'https://' : 'http://').concat(Server.DOCUMENT_DOMAIN);
	public static readonly ENDPOINT_VERSIONS = [ServerEndpointVersion.V1, ServerEndpointVersion.V2];
	public static readonly DOCUMENT_PATH = 'documents/';
	public static readonly DOCUMENT_NAME_LENGTH_MIN = 2;
	public static readonly DOCUMENT_NAME_LENGTH_MAX = 32;
	public static readonly DOCUMENT_NAME_LENGTH_DEFAULT = 8;

	private readonly ELYSIA: Elysia = new Elysia({ precompile: true });
	private readonly DATABASE = new Database(undefined);

	public constructor() {
		Server.DOCS_ENABLED && this.initDocs();
		this.initCORS();
		this.initErrorListener();
		this.initEndpoints();

		this.ELYSIA.listen(Server.PORT, ({ port }) => console.info(`Listening on: http://localhost:${port}`));
	}

	public get elysia(): Elysia {
		return this.ELYSIA;
	}

	public get database(): Database {
		return this.DATABASE;
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

	private initCORS(): void {
		const globalHeaders: Record<string, string> = {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': '*'
		};

		this.ELYSIA.headers(globalHeaders).options('*', ({ set }) => {
			set.headers['Access-Control-Max-Age'] = (300).toString();

			return new Response(null, {
				status: 204
			});
		});

		this.ELYSIA.headers(globalHeaders).onRequest(() => undefined);
	}

	private initErrorListener(): void {
		this.ELYSIA.onError(({ code, error }) => {
			if (code === 'NOT_FOUND') {
				return '';
			}

			if (code === 'VALIDATION') {
				return ErrorHandler.get(ErrorCode.validation);
			}

			if (code === 'PARSE') {
				return ErrorHandler.get(ErrorCode.parse);
			}

			if (error instanceof Error || code === 'INTERNAL_SERVER_ERROR') {
				console.error(error);
				return ErrorHandler.get(ErrorCode.crash);
			}

			return error;
		});
	}

	private initEndpoints(): void {
		const routes = {
			[ServerEndpointVersion.V1]: {
				endpoints: [
					new AccessRawV1(this),
					new AccessV1(this),
					new IndexV1(this),
					new PublishV1(this),
					new RemoveV1(this)
				],
				prefixes: ['/api/v1/documents']
			},
			[ServerEndpointVersion.V2]: {
				endpoints: [
					new AccessRawV2(this),
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
