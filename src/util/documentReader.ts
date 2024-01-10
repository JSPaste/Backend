import type { BunFile } from 'bun';

import { DocumentDataStruct } from '../structures/documentStruct';

export async function ReadDocument(file: BunFile): Promise<DocumentDataStruct> {
	return DocumentDataStruct.fromBinary(
		Bun.inflateSync(Buffer.from(await file.arrayBuffer())),
	);
}
