type HandleAccess = {
	key: string;
	password?: string;
	raw?: boolean;
};

type HandleEdit = {
	key: string;
	newBody: any;
	secret?: string;
};

type HandleExists = {
	key: string;
};

type HandlePublish = {
	body: any;
	selectedSecret?: string;
	lifetime?: number;
	password?: string;
	selectedKeyLength?: number;
	selectedKey?: string;
};

type HandleRemove = {
	key: string;
	secret: string;
};

type HandleGetDocument = {
	key: string;
	password?: string;
};

export type { HandleAccess, HandleEdit, HandleExists, HandlePublish, HandleRemove, HandleGetDocument };
