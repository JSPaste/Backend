import { get as env } from 'env-var';

export class ENV {
	public static readonly PORT = env('PORT').default(4000).asPortNumber();
	public static readonly LOGLEVEL = env('LOGLEVEL').default('info').asString();
	public static readonly DOCUMENT_TLS = env('DOCUMENT_TLS').asBoolStrict() ?? false;
	public static readonly DOCUMENT_DOMAIN = env('DOCUMENT_DOMAIN').default('localhost').asString();
	public static readonly DOCUMENT_MAXSIZE = env('DOCUMENT_MAXSIZE').default(1024).asIntPositive();
	public static readonly DOCS_ENABLED = env('DOCS_ENABLED').asBoolStrict() ?? false;
	public static readonly DOCS_PATH = env('DOCS_PATH').default('/docs').asString();
}
