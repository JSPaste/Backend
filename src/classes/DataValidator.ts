export class DataValidator {
	public static isValidNumber(value: number): boolean {
		return Number.isFinite(value);
	}

	public static isValidInteger(value: number): boolean {
		return DataValidator.isValidNumber(value) && Number.isInteger(value);
	}

	public static isValidString(value: string): boolean {
		return typeof value === 'string' && !!value.trim();
	}

	public static isValidArray<T>(value: T[], validator: (value: T) => boolean): boolean {
		return Array.isArray(value) && value.every(validator);
	}

	public static isValidStringArray(values: string[]): boolean {
		return DataValidator.isValidArray(values, DataValidator.isValidString);
	}

	public static isValidStringList(...values: string[]): boolean {
		return DataValidator.isValidStringArray(values);
	}

	public static isAlphanumeric(value: string): boolean {
		return DataValidator.isValidString(value) && /^[\w+]+$/.test(value);
	}

	public static isLengthBetweenLimits(value: any, min: number, max: number): boolean {
		return value.length >= min && value.length <= max;
	}

	public static isStringLengthBetweenLimits(value: string, min: number, max: number): boolean {
		return DataValidator.isValidString(value) && value.length >= min && value.length <= max;
	}

	public static isStringArrayLengthBetweenLimits(min: number, max: number, values: string[]): boolean {
		return DataValidator.isValidArray(values, (value) =>
			DataValidator.isStringLengthBetweenLimits(value, min, max)
		);
	}

	public static isStringListLengthBetweenLimits(min: number, max: number, ...values: string[]): boolean {
		return DataValidator.isStringArrayLengthBetweenLimits(min, max, values);
	}
}
