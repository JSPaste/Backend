enum ErrorCode {
	// * Internal (generic)
	crash = 1000,
	unknown = 1001,
	validation = 1002,
	parse = 1003,
	notFound = 1004,

	// * Validation
	validationInvalid = 1100,

	// * Document
	documentNotFound = 1200,
	documentKeyAlreadyExists = 1201,
	documentPasswordNeeded = 1202,
	documentInvalidLength = 1203,
	documentInvalidKeyLength = 1204,
	documentInvalidPassword = 1205,
	documentInvalidPasswordLength = 1206,
	documentInvalidSecret = 1207,
	documentInvalidSecretLength = 1208
}

type Type = 'internal' | 'validation' | 'document';

type Schema = {
	httpCode: number;
	type: Type;
	message: string;
};

export { ErrorCode, type Schema };
