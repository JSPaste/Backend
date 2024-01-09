export class DataValidator {
	static isValidNumber(value: number) {
		return !Number.isNaN(value);
	}

	static isValidInteger(value: number) {
		return this.isValidNumber(value) && Number.isInteger(value);
	}

	static isValidString(value: string) {
		return typeof value === 'string' && !!value.trim();
	}

	static isAlphanumeric(value: string) {
		return this.isValidString(value) && /^[\w-.=:]+$/.test(value);
	}

	static isValidStringArray(values: string[]) {
		return values.every((value) => this.isValidString(value));
	}

	static isValidStringList(...values: string[]) {
		return this.isValidStringArray(values);
	}

	static isStringLengthBetweenLimits(
		value: string,
		min: number,
		max: number,
	) {
		return (
			this.isValidString(value) &&
			value.length >= min &&
			value.length <= max
		);
	}

	static isStringArrayLengthBetweenLimits(
		min: number,
		max: number,
		values: string[],
	) {
		return values.every((value) =>
			this.isStringLengthBetweenLimits(value, min, max),
		);
	}

	static isStringListLengthBetweenLimits(
		min: number,
		max: number,
		...values: string[]
	) {
		return this.isStringArrayLengthBetweenLimits(min, max, values);
	}
}
