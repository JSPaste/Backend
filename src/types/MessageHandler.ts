enum ErrorCode {
	// Client Codes from 1000 to 1999
	// * Generic
	//reservedSTART = 1000,
	//reservedEND = 1099,
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
	document_InvalidSecretLength = 1208,

	// Server Codes from 2000 to 2999
	// * Generic
	serverError = 2000,
	notFound = 2001,
	validation = 2002,
	parseFailed = 2003,
	// * Other
	unknown = 2999
}

type Type = 'server' | 'client';

type Schema = {
	httpCode: number;
	type: Type;
	message: string;
};

export { ErrorCode, type Schema };
