import type { BunFile } from 'bun';
import { DocumentDataStruct, type IDocumentDataStruct } from '../structures/Structures';
import { Server } from './Server.ts';

export class DocumentManager {
	public static async read(file: BunFile): Promise<DocumentDataStruct> {
		return DocumentDataStruct.decode(Bun.inflateSync(Buffer.from(await file.arrayBuffer())));
	}

	public static async write(filePath: string, document: IDocumentDataStruct): Promise<void> {
		await Bun.write(
			filePath,
			Bun.deflateSync(DocumentDataStruct.encode(document).finish(), { level: Server.ZLIB_LEVEL })
		);
	}
}
