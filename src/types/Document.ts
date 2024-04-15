type DocumentV1 = {
	data: Uint8Array;
	header: {
		secretHash: Uint8Array;
		sse: boolean;
	};
	version: 1;
};

export type { DocumentV1 };
