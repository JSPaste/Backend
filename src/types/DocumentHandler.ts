import { ServerVersion } from './Server.ts';
import type { Range } from './Range.ts';

type Parameters = {
	access: {
		[ServerVersion.v1]: {
			key: string;
		};
		[ServerVersion.v2]: {
			key: string;
			password?: string;
		};
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
		[ServerVersion.v1]: {
			body: any;
		};
		[ServerVersion.v2]: {
			body: any;
			selectedSecret?: string;
			lifetime?: number;
			password?: string;
			selectedKeyLength?: Range<2, 32>;
			selectedKey?: string;
		};
	};
	remove: {
		key: string;
		secret: string;
	};
};

export type { Parameters };
