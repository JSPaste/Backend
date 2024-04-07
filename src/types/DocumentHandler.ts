type Parameters = {
	access: {
		key: string;
		password?: string;
	};
	edit: {
		body: any;
		key: string;
		secret?: string;
	};
	exists: {
		key: string;
	};
	publish: {
		body: any;
		selectedSecret?: string;
		lifetime?: number;
		password?: string;
		selectedKeyLength?: number;
		selectedKey?: string;
	};
	remove: {
		key: string;
		secret?: string;
	};
};

export type { Parameters };
