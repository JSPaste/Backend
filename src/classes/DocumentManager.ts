import type { BunFile } from 'bun';
import { zlibConfig } from '../utils/constants.ts';
import { DocumentDataStruct } from '../structures/Structures';

export class DocumentManager {
	public static async read(file: BunFile): Promise<DocumentDataStruct> {
		return DocumentDataStruct.decode(Bun.inflateSync(Buffer.from(await file.arrayBuffer())));
	}

	public static async write(filePath: string, document: DocumentDataStruct): Promise<void> {
		await Bun.write(filePath, Bun.deflateSync(DocumentDataStruct.encode(document).finish(), zlibConfig));
	}
}
