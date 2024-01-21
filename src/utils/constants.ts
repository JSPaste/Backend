import type { ServerOptions } from '../interfaces/ServerOptions.ts';

export const defaultServerOptions: ServerOptions = {
	hostname: process.env['HOSTNAME'] || 'https://jspaste.eu',
	port: process.env['PORT'] ?? 4000,
	versions: [1, 2]
} as const satisfies Required<ServerOptions>;

// TODO: Move to Server as static?
export const basePath = process.env['DOCUMENTS_PATH'] || 'documents/';
export const maxDocLength = parseInt(process.env['MAX_FILE_LENGTH'] || '2000000');
