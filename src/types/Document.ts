enum DocumentVersion {
	V1 = 1
}

interface Document {
	data: Uint8Array;
	header: {
		name: string;
		secretHash: Uint8Array;
		passwordHash: Uint8Array | null;
	};
	version: DocumentVersion;
}

export type { Document };
export { DocumentVersion };
