import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

export class CryptoUtils {
	private static readonly CIPHER_ALGORITHM = 'aes-256-gcm';
	private static readonly HASH_ALGORITHM = 'blake2b256';
	private static readonly IV_LENGTH = 12;

	public static encrypt(data: Uint8Array, password: string): Uint8Array {
		const iv = randomBytes(CryptoUtils.IV_LENGTH);
		const key = CryptoUtils.hash(password);
		const cipher = createCipheriv(CryptoUtils.CIPHER_ALGORITHM, key, iv);
		const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);

		return Buffer.concat([iv, encrypted]);
	}

	public static decrypt(data: Uint8Array, password: string): Uint8Array {
		const iv = data.slice(0, CryptoUtils.IV_LENGTH);
		const encryptedData = data.slice(CryptoUtils.IV_LENGTH);
		const key = CryptoUtils.hash(password);
		const decipher = createDecipheriv(CryptoUtils.CIPHER_ALGORITHM, key, iv);

		return Buffer.concat([decipher.update(encryptedData), decipher.final()]);
	}

	public static hash(password: string): string {
		return new Bun.CryptoHasher(CryptoUtils.HASH_ALGORITHM).update(password).digest('base64');
	}

	public static compare(password: string, hash: string): boolean {
		return CryptoUtils.hash(password) === hash;
	}
}
