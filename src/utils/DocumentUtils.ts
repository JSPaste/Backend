import type { BunFile } from 'bun';
import { decode, encode } from 'cbor-x';
import { ErrorHandler } from '../classes/ErrorHandler.ts';
import { Server } from '../classes/Server.ts';
import type { DocumentV1 } from '../types/Document.ts';
import { ErrorCode } from '../types/ErrorHandler.ts';
import { CryptoUtils } from './CryptoUtils.ts';
import { ValidatorUtils } from './ValidatorUtils.ts';

export class DocumentUtils {
	public static async documentRead(file: BunFile): Promise<DocumentV1> {
		return decode(new Uint8Array(await file.arrayBuffer()));
	}

	public static async documentWrite(filePath: string, document: DocumentV1): Promise<void> {
		await Bun.write(filePath, encode(document));
	}

	public static async retrieveDocument(key: string): Promise<BunFile> {
		const file = Bun.file(Server.DOCUMENT_PATH + key);

		if (!(await file.exists())) {
			ErrorHandler.send(ErrorCode.documentNotFound);
		}

		return file;
	}

	public static validateKey(key: string): void {
		if (
			!ValidatorUtils.isValidBase64URL(key) ||
			!ValidatorUtils.isLengthWithinRange(
				Bun.stringWidth(key),
				Server.DOCUMENT_KEY_LENGTH_MIN,
				Server.DOCUMENT_KEY_LENGTH_MAX
			)
		) {
			ErrorHandler.send(ErrorCode.validationInvalid);
		}
	}

	public static validateSecret(secret: string, documentSecret: DocumentV1['header']['modHash']): void {
		if (!CryptoUtils.compare(secret, documentSecret)) {
			ErrorHandler.send(ErrorCode.documentInvalidSecret);
		}
	}

	public static validateSecretLength(secret: string): void {
		if (
			ValidatorUtils.isEmptyString(secret) ||
			!ValidatorUtils.isLengthWithinRange(Bun.stringWidth(secret), 1, 255)
		) {
			ErrorHandler.send(ErrorCode.documentInvalidSecretLength);
		}
	}

	public static validatePassword(
		password: string | undefined,
		documentPassword: DocumentV1['header']['dataHash']
	): void {
		if (documentPassword) {
			if (password && !CryptoUtils.compare(password, documentPassword)) {
				ErrorHandler.send(ErrorCode.documentInvalidPassword);
			}
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

	public static validateSizeBetweenLimits(body: any): void {
		if (!ValidatorUtils.isLengthWithinRange(Buffer.byteLength(body, 'utf8'), 1, Server.DOCUMENT_MAXLENGTH)) {
			ErrorHandler.send(ErrorCode.documentInvalidLength);
		}
	}

	public static validateSelectedKey(key: string | undefined): void {
		if (
			key &&
			(!ValidatorUtils.isValidBase64URL(key) ||
				!ValidatorUtils.isLengthWithinRange(
					Bun.stringWidth(key),
					Server.DOCUMENT_KEY_LENGTH_MIN,
					Server.DOCUMENT_KEY_LENGTH_MAX
				))
		) {
			ErrorHandler.send(ErrorCode.validationInvalid);
		}
	}

	public static validateSelectedKeyLength(length: number | undefined): void {
		if (
			length &&
			!ValidatorUtils.isLengthWithinRange(length, Server.DOCUMENT_KEY_LENGTH_MIN, Server.DOCUMENT_KEY_LENGTH_MAX)
		) {
			ErrorHandler.send(ErrorCode.documentInvalidKeyLength);
		}
	}
}
