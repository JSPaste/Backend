type DocumentV1 = {
	data: Uint8Array;
	header: {
		secret: Uint8Array;
		sse: boolean;
		createdAt: number;
	};
	version: 1;
};

export type { DocumentV1 };
