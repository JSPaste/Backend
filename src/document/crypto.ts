import { randomBytes } from 'node:crypto';

const hashAlgorithm = 'blake2b256';
const saltLength = 16;

export const crypto = {
	hash: (password: string): Uint8Array => {
		const salt = randomBytes(saltLength);
		const hasher = new Bun.CryptoHasher(hashAlgorithm).update(salt).update(password);

		return Buffer.concat([salt, hasher.digest()]);
	},

	compare: (password: string, hash: Uint8Array): boolean => {
		const salt = hash.subarray(0, saltLength);
		const hasher = new Bun.CryptoHasher(hashAlgorithm).update(salt).update(password);

		const passwordHash = Buffer.concat([salt, hasher.digest()]);

		return hash.every((value, index) => value === passwordHash[index]);
	}
} as const;
