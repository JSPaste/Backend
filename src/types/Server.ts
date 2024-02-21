import type { ZlibCompressionOptions } from 'bun';

enum ServerEndpointVersion {
	v1 = 1,
	v2 = 2
}

type ServerConfig = {
	tls: boolean;
	domain: string;
	port: number;
	versions: ServerEndpointVersion[];
	documents: {
		documentPath: string;
		maxLength: number;
		maxTime: number;
	};
	docs: {
		enabled: boolean;
		path: string;
		playground: {
			tls: boolean;
			domain: string;
			port: number;
		};
	};
	zlib: ZlibCompressionOptions;
};

export { ServerEndpointVersion, type ServerConfig };
