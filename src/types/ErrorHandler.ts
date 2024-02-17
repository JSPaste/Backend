enum JSPErrorCode {
	unknown = 'jsp.unknown',
	notFound = 'jsp.not_found',
	validation = 'jsp.validation_failed',
	internalServerError = 'jsp.internal_server_error',
	parseFailed = 'jsp.parse_failed',
	inputInvalid = 'jsp.input.invalid',
	documentNotFound = 'jsp.document.not_found',
	documentPasswordNeeded = 'jsp.document.needs_password',
	documentInvalidPasswordLength = 'jsp.document.invalid_password_length',
	documentInvalidPassword = 'jsp.document.invalid_password',
	documentInvalidLength = 'jsp.document.invalid_length',
	documentInvalidSecret = 'jsp.document.invalid_secret',
	documentInvalidSecretLength = 'jsp.document.invalid_secret_length',
	documentInvalidKeyLength = 'jsp.document.invalid_key_length',
	documentKeyAlreadyExists = 'jsp.document.key_already_exists'
}

type JSPError = {
	type: 'error';
	message: string;
	errorCode: JSPErrorCode;
};

export { JSPErrorCode, type JSPError };
