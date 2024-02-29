import type { ZlibCompressionOptions } from 'bun';
import type { ElysiaConfig } from 'elysia';

enum ServerEndpointVersion {
	v1 = 1,
	v2 = 2
}

type ServerConfig = {
	tls: boolean;
	domain: string;
	port: number;
	versions: ServerEndpointVersion[];
	elysia: ElysiaConfig<'', false>;
	documents: {
		defaultKeyLength: 8;
		documentPath: string;
		maxLength: number;
		maxTime: number;
	};
	docs: {
		enabled: boolean;
		path: string;
	};
	zlib: ZlibCompressionOptions;
};

export { ServerEndpointVersion, type ServerConfig };
