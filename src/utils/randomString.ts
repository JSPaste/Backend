import { characters, type NumericRange } from './constants.ts';

export function randomString(length: number, base: NumericRange<2, 64> = 62): string {
	const baseSet = characters.slice(0, base);
	let string = '';

	while (length--) string += baseSet.charAt(Math.floor(Math.random() * baseSet.length));
	return string;
}
