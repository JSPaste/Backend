enum DocumentVersion {
	V1 = 1
}

interface Document {
	data: Uint8Array;
	header: {
		name: string;
		secretHash: Buffer;
		passwordHash: Buffer | null;
	};
	version: DocumentVersion;
}

export type { Document };
export { DocumentVersion };
