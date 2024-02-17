enum ServerVersion {
	v1 = 1,
	v2 = 2
}

type ServerOptions = {
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
};

export { ServerVersion, type ServerOptions };
