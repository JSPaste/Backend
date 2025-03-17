import { env } from '#util/env.ts';

export const config = {
	protocol: env.tls ? 'https://' : 'http://',
	apiPath: '/api',
	storagePath: 'storage/',
	documentNameLengthMin: 2,
	documentNameLengthMax: 32,
	documentNameLengthDefault: 8
} as const;
