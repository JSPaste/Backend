type DocumentV1 = {
	data: Uint8Array;
	header: {
		dataHash: Uint8Array | null;
		modHash: Uint8Array;
		createdAt: number;
	};
	version: 1;
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

// TODO: Type every response for consistency
type ResponsesV1 = {
	access: {
		key: string;
		data: string;
	};
	publish: {
		key: string;
		secret: string;
	};
};

type ResponsesV2 = {
	access: ResponsesV1['access'] & {
		url: string;
		expirationTimestamp: number;
	};
	publish: ResponsesV1['publish'] & { url: string; expirationTimestamp: number };
};

export type { DocumentV1, Parameters, ResponsesV1, ResponsesV2 };
