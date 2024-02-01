export class DataValidator {
	public static isValidNumber(value: number) {
		return !Number.isNaN(value);
	}

	public static isValidInteger(value: number) {
		return DataValidator.isValidNumber(value) && Number.isInteger(value);
	}

	public static isValidString(value: string) {
		return typeof value === 'string' && !!value.trim();
	}

	public static isAlphanumeric(value: string) {
		return DataValidator.isValidString(value) && /^\w+$/.test(value);
	}

	public static isValidStringArray(values: string[]) {
		return values.every((value) => DataValidator.isValidString(value));
	}

	public static isValidStringList(...values: string[]) {
		return DataValidator.isValidStringArray(values);
	}

	public static isStringLengthBetweenLimits(value: string, min: number, max: number) {
		return DataValidator.isValidString(value) && value.length >= min && value.length <= max;
	}

	public static isLengthBetweenLimits(value: any, min: number, max: number) {
		return value.length >= min && value.length <= max;
	}

	public static isStringArrayLengthBetweenLimits(min: number, max: number, values: string[]) {
		return values.every((value) => DataValidator.isStringLengthBetweenLimits(value, min, max));
	}

	public static isStringListLengthBetweenLimits(min: number, max: number, ...values: string[]) {
		return DataValidator.isStringArrayLengthBetweenLimits(min, max, values);
	}
}
