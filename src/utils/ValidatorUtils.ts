import type { ErrorType } from '../types/JSPError.ts';

export class ValidatorUtils {
	public static isValidType<T>(value: unknown, type: new (...args: any[]) => T): value is T {
		return value instanceof type;
	}

	public static isValidPrimitiveType<T>(value: unknown, type: string): value is T {
		return typeof value === type;
	}

	public static isValidNumber(value: number): boolean {
		return Number.isFinite(value) && Number.isInteger(value);
	}

	public static isValidString(value: string): boolean {
		return ValidatorUtils.isValidPrimitiveType(value, 'string') && !!value.trim();
	}

	public static isValidArray<T>(value: T[], validator: (value: T) => boolean): boolean {
		return Array.isArray(value) && value.every(validator);
	}

	public static isValidStringArray(values: string[]): boolean {
		return ValidatorUtils.isValidArray(values, ValidatorUtils.isValidString);
	}

	public static isJSPError(value?: any): value is ErrorType {
		return (value as ErrorType)?.type === 'error';
	}

	public static isValidStringList(...values: string[]): boolean {
		return ValidatorUtils.isValidStringArray(values);
	}

	public static isValidDomain(value: string): boolean {
		if (value === 'localhost') return true;

		return (
			ValidatorUtils.isValidString(value) &&
			/\b((?=[a-z0-9-]{1,63}\.)(xn--)?[a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,63}\b/.test(value)
		);
	}

	public static isAlphanumeric(value: string): boolean {
		return ValidatorUtils.isValidString(value) && /^[\w-]+$/.test(value);
	}

	public static isLengthBetweenLimits(value: any, min: number, max: number): boolean {
		return value.length >= min && value.length <= max;
	}

	public static isStringLengthBetweenLimits(value: string, min: number, max: number): boolean {
		return ValidatorUtils.isValidString(value) && ValidatorUtils.isLengthBetweenLimits(value, min, max);
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
