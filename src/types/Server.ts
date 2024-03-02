import type { ZlibCompressionOptions } from 'bun';

enum ServerVersion {
	v1 = 1,
	v2 = 2
}

type ServerOptions = {
	tls: boolean;
	domain: string;
	port: number;
	versions: ServerVersion[];
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

export { ServerVersion, type ServerOptions };
