type DocumentV1 = {
	data: Uint8Array;
	header: {
		dataHash: Uint8Array | null;
		modHash: Uint8Array;
		createdAt: number;
		accessedAt: number;
	};
};

type Parameters = {
	access: {
		key: string;
		password?: string;
	};
	edit: {
		body: string;
		key: string;
		secret: string;
		password?: string;
	};
	exists: {
		key: string;
	};
	publish: {
		body: string;
		selectedSecret?: string;
		password?: string;
		selectedKeyLength?: number;
		selectedKey?: string;
	};
	remove: {
		key: string;
		secret: string;
	};
};

export type { DocumentV1, Parameters };
