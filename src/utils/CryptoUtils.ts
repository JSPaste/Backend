import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import type { SupportedCryptoAlgorithms } from 'bun';

export class CryptoUtils {
	private static readonly CIPHER_ALGORITHM = 'aes-256-ctr';
	private static readonly HASH_ALGORITHM = 'blake2b256';
	private static readonly IV_LENGTH = 16;

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

	public static hash(
		data: string | Uint8Array,
		algorithm: SupportedCryptoAlgorithms = CryptoUtils.HASH_ALGORITHM
	): Uint8Array {
		return new Bun.CryptoHasher(algorithm).update(data).digest() as Uint8Array;
	}

	public static compare(password: string, hash: Uint8Array, algorithm?: SupportedCryptoAlgorithms): boolean {
		const hashPassword = CryptoUtils.hash(password, algorithm);

		return hashPassword.length === hash.length && hashPassword.every((value, index) => value === hash[index]);
	}
}
