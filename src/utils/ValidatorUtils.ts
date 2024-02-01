export class ValidatorUtils {
	public static isValidNumber(value: number): boolean {
		return Number.isFinite(value);
	}

	public static isValidInteger(value: number): boolean {
		return ValidatorUtils.isValidNumber(value) && Number.isInteger(value);
	}

	public static isValidString(value: string): boolean {
		return typeof value === 'string' && !!value.trim();
	}

	public static isValidArray<T>(value: T[], validator: (value: T) => boolean): boolean {
		return Array.isArray(value) && value.every(validator);
	}

	public static isValidStringArray(values: string[]): boolean {
		return ValidatorUtils.isValidArray(values, ValidatorUtils.isValidString);
	}

	public static isValidStringList(...values: string[]): boolean {
		return ValidatorUtils.isValidStringArray(values);
	}

	public static isAlphanumeric(value: string): boolean {
		return ValidatorUtils.isValidString(value) && /^[\w+]+$/.test(value);
	}

	public static isLengthBetweenLimits(value: any, min: number, max: number): boolean {
		return value.length >= min && value.length <= max;
	}

	public static isStringLengthBetweenLimits(value: string, min: number, max: number): boolean {
		return ValidatorUtils.isValidString(value) && value.length >= min && value.length <= max;
	}

	public static isStringArrayLengthBetweenLimits(min: number, max: number, values: string[]): boolean {
		return ValidatorUtils.isValidArray(values, (value) =>
			ValidatorUtils.isStringLengthBetweenLimits(value, min, max)
		);
	}

	public static isStringListLengthBetweenLimits(min: number, max: number, ...values: string[]): boolean {
		return ValidatorUtils.isStringArrayLengthBetweenLimits(min, max, values);
	}
}
