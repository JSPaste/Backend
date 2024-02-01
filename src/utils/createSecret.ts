import { randomString } from './randomString.ts';

export async function createSecret(chunkLength: number = 5, chunks: number = 4): Promise<string> {
	return Array.from({ length: chunks }, () => randomString(chunkLength)).join('-');
}
