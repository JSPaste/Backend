import { OpenAPIHono } from '@hono/zod-openapi';
import { apiReference } from '@scalar/hono-api-reference';
import { get as env } from 'env-var';
import { cors } from 'hono/cors';
import { v1 } from '../endpoints/v1';
import { v2 } from '../endpoints/v2';

export class Server {
	// ENV
	public static readonly PORT = env('PORT').default(4000).asPortNumber();
	public static readonly DOCUMENT_TLS = env('DOCUMENT_TLS').asBoolStrict() ?? false;
	public static readonly DOCUMENT_DOMAIN = env('DOCUMENT_DOMAIN').default('localhost').asString();
	public static readonly DOCUMENT_MAXSIZE = env('DOCUMENT_MAXSIZE').default(1024).asIntPositive();
	public static readonly DOCS_ENABLED = env('DOCS_ENABLED').asBoolStrict() ?? false;
	public static readonly DOCS_PATH = env('DOCS_PATH').default('/docs').asString();

	// CONFIG
	public static readonly HOSTNAME = (Server.DOCUMENT_TLS ? 'https://' : 'http://').concat(Server.DOCUMENT_DOMAIN);
	public static readonly PATH = '/api';
	public static readonly DOCUMENT_PATH = 'documents/';
	public static readonly DOCUMENT_NAME_LENGTH_MIN = 2;
	public static readonly DOCUMENT_NAME_LENGTH_MAX = 32;
	public static readonly DOCUMENT_NAME_LENGTH_DEFAULT = 8;

	private readonly _instance = new OpenAPIHono().basePath(Server.PATH);

	public constructor() {
		this.initInstance();
		this.initEndpoints();
		Server.DOCS_ENABLED && this.initDocs();

		console.info('Started', this._instance.routes.length, 'routes');
		console.info(`Listening on: http://localhost:${Server.PORT}`);
	}

	public get instance() {
		return this._instance;
	}

	private initInstance() {
		this._instance.use('*', cors());

		this._instance.onError((err, ctx) => {
			return ctx.json(JSON.parse(err.message));
		});

		this._instance.notFound((ctx) => {
			ctx.status(404);

			return ctx.body(null);
		});
	}

	private initDocs() {
		this._instance.doc('/oas.json', {
			openapi: '3.0.3',
			info: {
				title: 'JSPaste API',
				version: 'rolling',
				description: 'Note: The latest API version can be used with the "/documents" alias route.',
				license: {
					name: 'EUPL-1.2',
					url: 'https://joinup.ec.europa.eu/sites/default/files/custom-page/attachment/2020-03/EUPL-1.2%20EN.txt'
				}
			},
			servers: [
				{
					url: 'https://jspaste.eu',
					description: 'Official JSPaste instance'
				},
				{
					url: 'https://paste.inetol.net',
					description: 'Inetol Infrastructure instance'
				},
				{
					url: 'http://localhost:4000',
					description: 'Local instance (Only use if you are running the backend locally)'
				}
			]
		});

		this._instance.get(
			Server.DOCS_PATH,
			apiReference({
				pageTitle: 'JSPaste Documentation',
				theme: 'saturn',
				layout: 'classic',
				isEditable: false,
				spec: {
					url: Server.PATH.concat('/oas.json')
				}
			})
		);
	}

	// TODO: Alias routes
	private initEndpoints() {
		this._instance.route('/v1/documents', v1());
		this._instance.route('/v2/documents', v2());
		this._instance.route('/documents', v2());
	}
}
