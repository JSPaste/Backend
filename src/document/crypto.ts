import { randomBytes } from 'node:crypto';

const hashAlgorithm = 'blake2b256';
const saltLength = 16;

export const crypto = {
	hash: (password: string): Buffer => {
		const salt = randomBytes(saltLength);
		const hasher = new Bun.CryptoHasher(hashAlgorithm).update(salt).update(password);

		return Buffer.concat([salt, hasher.digest()]);
	},

	compare: (password: string, hash: Buffer): boolean => {
		const salt = hash.subarray(0, saltLength);
		const hasher = new Bun.CryptoHasher(hashAlgorithm).update(salt).update(password);

		const passwordHash = Buffer.concat([salt, hasher.digest()]);

		return hash.equals(passwordHash);
	}
} as const;
