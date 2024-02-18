type Access = {
	key: string;
	password?: string;
	raw?: boolean;
};

type Edit = {
	key: string;
	newBody: any;
	secret?: string;
};

type Exists = {
	key: string;
};

type Publish = {
	body: any;
	selectedSecret?: string;
	lifetime?: number;
	password?: string;
	selectedKeyLength?: number;
	selectedKey?: string;
};

type Remove = {
	key: string;
	secret: string;
};

export type { Access, Edit, Exists, Publish, Remove };
