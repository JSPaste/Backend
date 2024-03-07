enum ErrorCode {
	// * Internal (generic)
	crash = 1000,
	unknown = 1001,
	validation = 1002,
	parse = 1003,
	notFound = 1004,

	// * Validation
	validation_invalid = 1100,

	// * Document
	document_NotFound = 1200,
	document_KeyAlreadyExists = 1201,
	document_PasswordNeeded = 1202,
	document_InvalidLength = 1203,
	document_InvalidKeyLength = 1204,
	document_InvalidPassword = 1205,
	document_InvalidPasswordLength = 1206,
	document_InvalidSecret = 1207,
	document_InvalidSecretLength = 1208
}

type Type = 'internal' | 'validation' | 'document';

type Schema = {
	httpCode: number;
	type: Type;
	message: string;
};

export { ErrorCode, type Schema };
