enum DocumentVersion {
	V1 = 1
}

interface Document {
	data: Uint8Array;
	header: {
		name: string;
		secretHash: string;
		passwordHash: string | null;
	};
	version: DocumentVersion;
}

interface DocumentV1 extends Document {
	version: DocumentVersion.V1;
}

export { DocumentVersion, type Document, type DocumentV1 };
