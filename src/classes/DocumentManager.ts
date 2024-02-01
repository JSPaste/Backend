import type { BunFile } from 'bun';
import { DocumentDataStruct } from '../structures/documentStruct';
import { zlibConfig } from '../utils/constants.ts';

export class DocumentManager {
	public static async read(file: BunFile): Promise<DocumentDataStruct> {
		return DocumentDataStruct.fromBinary(Bun.gunzipSync(Buffer.from(await file.arrayBuffer())));
	}

	public static async write(filePath: string, document: DocumentDataStruct): Promise<void> {
		await Bun.write(filePath, Bun.gzipSync(DocumentDataStruct.toBinary(document), zlibConfig));
	}
}
