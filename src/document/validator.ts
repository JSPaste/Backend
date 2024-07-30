import { config } from '../server.ts';
import { errorHandler } from '../server/errorHandler.ts';
import type { Document } from '../types/Document.ts';
import { ErrorCode } from '../types/ErrorHandler.ts';
import { ValidatorUtils } from '../utils/ValidatorUtils.ts';
import { crypto } from './crypto.ts';

export const validator = {
	validateName: (key: string): void => {
		if (
			!ValidatorUtils.isValidBase64URL(key) ||
			!ValidatorUtils.isLengthWithinRange(
				Bun.stringWidth(key),
				config.documentNameLengthMin,
				config.documentNameLengthMax
			)
		) {
			errorHandler.send(ErrorCode.documentInvalidName);
		}
	},

	validateNameLength: (length: number | undefined): void => {
		if (
			length &&
			!ValidatorUtils.isLengthWithinRange(length, config.documentNameLengthMin, config.documentNameLengthMax)
		) {
			errorHandler.send(ErrorCode.documentInvalidNameLength);
		}
	},

	validatePassword: (password: string, dataHash: Document['header']['passwordHash']): void => {
		if (dataHash && !crypto.compare(password, dataHash)) {
			errorHandler.send(ErrorCode.documentInvalidPassword);
		}
	},

	validatePasswordLength: (password: string | undefined): void => {
		if (
			password &&
			(ValidatorUtils.isEmptyString(password) ||
				!ValidatorUtils.isLengthWithinRange(Bun.stringWidth(password), 1, 255))
		) {
			errorHandler.send(ErrorCode.documentInvalidPasswordLength);
		}
	},

	validateSecret: (secret: string, secretHash: Document['header']['secretHash']): void => {
		if (!crypto.compare(secret, secretHash)) {
			errorHandler.send(ErrorCode.documentInvalidSecret);
		}
	},

	validateSecretLength: (secret: string): void => {
		if (!ValidatorUtils.isLengthWithinRange(Bun.stringWidth(secret), 1, 255)) {
			errorHandler.send(ErrorCode.documentInvalidSecretLength);
		}
	}
} as const;
