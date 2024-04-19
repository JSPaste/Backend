import { decode, encode } from 'cbor-x';
import { ErrorHandler } from '../classes/ErrorHandler.ts';
import { Server } from '../classes/Server.ts';
import type { DocumentV1 } from '../types/Document.ts';
import { ErrorCode } from '../types/ErrorHandler.ts';
import { CryptoUtils } from './CryptoUtils.ts';
import { ValidatorUtils } from './ValidatorUtils.ts';

export class DocumentUtils {
	public static async documentReadV1(name: string): Promise<DocumentV1> {
		DocumentUtils.validateName(name);

		const file = Bun.file(Server.DOCUMENT_PATH + name);

		if (!(await file.exists())) {
			ErrorHandler.send(ErrorCode.documentNotFound);
		}

		return decode(Buffer.from(await file.arrayBuffer()));
	}

	public static async documentWriteV1(name: string, document: Omit<DocumentV1, 'version'>): Promise<void> {
		await Bun.write(Server.DOCUMENT_PATH + name, encode({ ...document, version: 1 }));
	}

	public static validateName(key: string): void {
		if (
			!ValidatorUtils.isValidBase64URL(key) ||
			!ValidatorUtils.isLengthWithinRange(
				Bun.stringWidth(key),
				Server.DOCUMENT_NAME_LENGTH_MIN,
				Server.DOCUMENT_NAME_LENGTH_MAX
			)
		) {
			ErrorHandler.send(ErrorCode.documentInvalidName);
		}
	}

	public static validateNameLength(length: number | undefined): void {
		if (
			length &&
			!ValidatorUtils.isLengthWithinRange(
				length,
				Server.DOCUMENT_NAME_LENGTH_MIN,
				Server.DOCUMENT_NAME_LENGTH_MAX
			)
		) {
			ErrorHandler.send(ErrorCode.documentInvalidNameLength);
		}
	}

	public static validatePassword(password: string, dataHash: DocumentV1['header']['dataHash']): void {
		if (dataHash && !CryptoUtils.compare(password, dataHash)) {
			ErrorHandler.send(ErrorCode.documentInvalidPassword);
		}
	}

	public static validatePasswordLength(password: string | undefined): void {
		if (
			password &&
			(ValidatorUtils.isEmptyString(password) ||
				!ValidatorUtils.isLengthWithinRange(Bun.stringWidth(password), 1, 255))
		) {
			ErrorHandler.send(ErrorCode.documentInvalidPasswordLength);
		}
	}

	public static validateSecret(secret: string, secretHash: DocumentV1['header']['secretHash']): void {
		if (!CryptoUtils.compare(secret, secretHash)) {
			ErrorHandler.send(ErrorCode.documentInvalidSecret);
		}
	}

	public static validateSecretLength(secret: string): void {
		if (!ValidatorUtils.isLengthWithinRange(Bun.stringWidth(secret), 1, 255)) {
			ErrorHandler.send(ErrorCode.documentInvalidSecretLength);
		}
	}

	public static validateSizeBetweenLimits(body: any): void {
		if (!ValidatorUtils.isLengthWithinRange(Buffer.byteLength(body), 1, Server.DOCUMENT_MAXLENGTH)) {
			ErrorHandler.send(ErrorCode.documentInvalidSize);
		}
	}
}
