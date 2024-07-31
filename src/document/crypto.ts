import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { env } from '../server.ts';

const cipherAlgorithm = 'aes-256-gcm';
const hashAlgorithm = 'blake2b256';
const ivLength = 12;

export const crypto = {
	encrypt: (data: Uint8Array, password: string): Uint8Array => {
		const iv = randomBytes(ivLength);
		const key = crypto.hash(password, 'binary');
		const cipher = createCipheriv(cipherAlgorithm, key, iv);
		const encrypted = Buffer.concat([cipher.update(data), cipher.final(), cipher.getAuthTag()]);

		return Buffer.concat([iv, encrypted]);
	},

	decrypt: (data: Uint8Array, password: string): Uint8Array => {
		const iv = data.slice(0, ivLength);
		const encryptedData = data.slice(ivLength);
		const key = crypto.hash(password, 'binary');
		const decipher = createDecipheriv(cipherAlgorithm, key, iv);

		decipher.setAuthTag(encryptedData.slice(-16));

		return Buffer.concat([decipher.update(encryptedData.slice(0, -16)), decipher.final()]);
	},

	hash: (password: string, encoding: 'base64' | 'binary' = 'base64'): string | Uint8Array => {
		const hasher = new Bun.CryptoHasher(hashAlgorithm).update(password + env.salt);

		switch (encoding) {
			case 'base64': {
				return hasher.digest('base64');
			}
			default: {
				return hasher.digest() as Uint8Array;
			}
		}
	},

	compare: (password: string, hash: string, encoding: 'base64' | 'binary' = 'base64'): boolean => {
		return crypto.hash(password, encoding) === hash;
	}
} as const;
