import type { ServerVersion } from '../utils/constants';

export interface ServerOptions {
	port: number;
	versions: ServerVersion[];
	docs: {
		enabled: boolean;
		path: string;
		playground: {
			domain: string;
			port: number;
		};
	};
}
