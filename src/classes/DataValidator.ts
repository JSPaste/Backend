export class DataValidator {
	static isValidNumber(value: number) {
		return !Number.isNaN(value);
	}

	static isValidInteger(value: number) {
		return DataValidator.isValidNumber(value) && Number.isInteger(value);
	}

	static isValidString(value: string) {
		return typeof value === 'string' && !!value.trim();
	}

	static isAlphanumeric(value: string) {
		return DataValidator.isValidString(value) && /^\w+$/.test(value);
	}

	static isValidStringArray(values: string[]) {
		return values.every((value) => DataValidator.isValidString(value));
	}

	static isValidStringList(...values: string[]) {
		return DataValidator.isValidStringArray(values);
	}

	static isStringLengthBetweenLimits(
		value: string,
		min: number,
		max: number,
	) {
		return (
			DataValidator.isValidString(value) &&
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
			DataValidator.isStringLengthBetweenLimits(value, min, max),
		);
	}

	static isStringListLengthBetweenLimits(
		min: number,
		max: number,
		...values: string[]
	) {
		return DataValidator.isStringArrayLengthBetweenLimits(min, max, values);
	}
}
