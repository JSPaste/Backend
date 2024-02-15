import type { ServerVersion } from '../utils/constants.ts';

export interface ServerOptions {
	tls: boolean;
	domain: string;
	port: number;
	versions: ServerVersion[];
	files: {};
	docs: {
		enabled: boolean;
		path: string;
		playground: {
			tls: boolean;
			domain: string;
			port: number;
		};
	};
}
