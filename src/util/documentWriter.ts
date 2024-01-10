import { DocumentDataStruct } from '../structures/documentStruct';

export async function WriteDocument(
	filePath: string,
	document: DocumentDataStruct,
) {
	await Bun.write(
		filePath,
		Bun.deflateSync(DocumentDataStruct.toBinary(document)),
	);
}
