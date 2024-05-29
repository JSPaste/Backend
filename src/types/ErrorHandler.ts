enum ErrorCode {
	// * Generic
	crash = 1000,
	unknown = 1001,
	validation = 1002,
	parse = 1003,
	notFound = 1004,

	// * Document
	documentNotFound = 1200,
	documentNameAlreadyExists = 1201,
	documentPasswordNeeded = 1202,
	documentInvalidSize = 1203,
	documentInvalidNameLength = 1204,
	documentInvalidPassword = 1205,
	documentInvalidPasswordLength = 1206,
	documentInvalidSecret = 1207,
	documentInvalidSecretLength = 1208,
	documentInvalidName = 1209,
	documentCorrupted = 1210
}

type Type = 'generic' | 'document';

type Schema = {
	httpCode: number;
	type: Type;
	message: string;
};

export { ErrorCode, type Schema };
