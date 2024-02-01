import { randomString } from './randomString.ts';

export async function createSecret(chunkLength: number = 5, chunks: number = 4): Promise<string> {
	const secret = await Promise.all(Array.from({ length: chunks }, () => randomString(chunkLength)));

	return secret.join('-');
}
