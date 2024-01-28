export interface ServerOptions {
	/** The hostname for swagger // TODO: hostname? maybe other things?? */
	docsHostname: string;

	/** The port to listen on */
	port: string | number;

	/** Accessible API versions */
	versions: number[];
}
