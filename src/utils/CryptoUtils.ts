import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

export class CryptoUtils {
	private static readonly CIPHER_ALGORITHM = 'aes-256-gcm';
	private static readonly HASH_ALGORITHM = 'blake2b256';
	private static readonly IV_LENGTH = 12;

	public static encrypt(data: Uint8Array, password: string): Uint8Array {
		const iv = randomBytes(CryptoUtils.IV_LENGTH);
		const key = CryptoUtils.hash(password, 'binary');
		const cipher = createCipheriv(CryptoUtils.CIPHER_ALGORITHM, key, iv);
		const encrypted = Buffer.concat([cipher.update(data), cipher.final(), cipher.getAuthTag()]);

		return Buffer.concat([iv, encrypted]);
	}

	public static decrypt(data: Uint8Array, password: string): Uint8Array {
		const iv = data.slice(0, CryptoUtils.IV_LENGTH);
		const encryptedData = data.slice(CryptoUtils.IV_LENGTH);
		const key = CryptoUtils.hash(password, 'binary');
		const decipher = createDecipheriv(CryptoUtils.CIPHER_ALGORITHM, key, iv);

		decipher.setAuthTag(encryptedData.slice(-16));

		return Buffer.concat([decipher.update(encryptedData.slice(0, -16)), decipher.final()]);
	}

	public static hash(password: string, encoding: 'base64' | 'binary' = 'base64'): string | Uint8Array {
		const hasher = new Bun.CryptoHasher(CryptoUtils.HASH_ALGORITHM).update(password);

		switch (encoding) {
			case 'base64': {
				return hasher.digest('base64');
			}
			default: {
				return hasher.digest() as Uint8Array;
			}
		}
	}

	public static compare(password: string, hash: string, encoding: 'base64' | 'binary' = 'base64'): boolean {
		return CryptoUtils.hash(password, encoding) === hash;
	}
}
