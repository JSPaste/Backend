import type { BunFile } from 'bun';
import { DocumentDataStruct } from '../structures/documentStruct';

export class DocumentManager {
	static async read(file: BunFile): Promise<DocumentDataStruct> {
		return DocumentDataStruct.fromBinary(
			Bun.inflateSync(Buffer.from(await file.arrayBuffer())),
		);
	}

	static async write(filePath: string, document: DocumentDataStruct) {
		await Bun.write(
			filePath,
			Bun.deflateSync(DocumentDataStruct.toBinary(document)),
		);
	}
}
