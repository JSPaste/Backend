import type { ServerOptions } from '../interfaces/ServerOptions.ts';

export const defaultServerOptions: ServerOptions = {
	hostname: process.env['HOSTNAME'] ?? 'https://jspaste.eu',
	port: process.env['PORT'] ?? 4000,

	// FIXME: Fix correct order when v2 is finished
	versions: ['v2', 'v1']
} as const satisfies Required<ServerOptions>;

// TODO: Move to Server as static?
export const basePath = process.env['DOCUMENTS_PATH'] ?? 'documents/';
export const maxDocLength = parseInt(process.env['MAX_FILE_LENGTH'] ?? '2000000');
