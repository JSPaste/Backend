export interface ServerOptions {
	/** The hostname for swagger // TODO: hostname? maybe other things?? */
	hostname: string;

	/** The port to listen on */
	port: string | number;

	/** Accessible API versions // TODO: string rlly? */
	versions: string[];
}
