type DocumentV1 = {
	data: Uint8Array;
	header: {
		dataHash: Uint8Array | null;
		modHash: Uint8Array;
		createdAt: number;
	};
	version: 1;
};

export type { DocumentV1 };
