enum ErrorCode {
	// * Generic
	crash = 1000,
	unknown = 1001,
	validation = 1002,
	parse = 1003,
	notFound = 1004,

	// * Document
	documentNotFound = 1200,
	documentKeyAlreadyExists = 1201,
	documentSecretNeeded = 1202,
	documentInvalidSize = 1203,
	documentInvalidKeyLength = 1204,
	// DEPRECATED: documentInvalidPassword = 1205,
	// DEPRECATED: documentInvalidPasswordLength = 1206,
	documentInvalidSecret = 1207,
	documentInvalidSecretLength = 1208,
	documentInvalidKey = 1209
}

type Type = 'generic' | 'document';

type Schema = {
	httpCode: number;
	type: Type;
	message: string;
};

export { ErrorCode, type Schema };
