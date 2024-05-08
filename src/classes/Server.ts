import { get as env } from 'env-var';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { default as V2 } from '../endpoints/v2';

export class Server {
	// ENV
	public static readonly PORT = env('PORT').default(4000).asPortNumber();
	public static readonly LOCAL = env('LOCAL').asBoolStrict() ?? true;
	public static readonly DOCUMENT_TLS = env('DOCUMENT_TLS').asBoolStrict() ?? false;
	public static readonly DOCUMENT_DOMAIN = env('DOCUMENT_DOMAIN').default('localhost').asString();
	public static readonly DOCUMENT_MAXLENGTH = env('DOCUMENT_MAXLENGTH').default(2000000).asIntPositive();
	public static readonly DOCS_ENABLED = env('DOCS_ENABLED').asBoolStrict() ?? false;
	public static readonly DOCS_PATH = env('DOCS_PATH').default('/docs').asString();

	// CONFIG
	public static readonly HOSTNAME = (Server.DOCUMENT_TLS ? 'https://' : 'http://').concat(Server.DOCUMENT_DOMAIN);
	public static readonly DOCUMENT_PATH = 'documents/';
	public static readonly DOCUMENT_NAME_LENGTH_MIN = 2;
	public static readonly DOCUMENT_NAME_LENGTH_MAX = 32;
	public static readonly DOCUMENT_NAME_LENGTH_DEFAULT = 8;

	private readonly _instance = new Hono().basePath('/api');

	public constructor() {
		this.initInstance();
		this.initEndpoints();

		console.info('Started', this._instance.routes.length, 'routes');
		console.info(`Listening on: http://127.0.0.1:${Server.PORT}`);
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

	// FIXME: Alias routes?
	private initEndpoints() {
		this._instance.route('/v1/documents', V2.endpoint);
		this._instance.route('/v2/documents', V2.endpoint);
		this._instance.route('/documents', V2.endpoint);
	}
}
