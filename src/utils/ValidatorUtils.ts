export class ValidatorUtils {
	public static isInstanceOf<T>(value: unknown, type: new (...args: any[]) => T): value is T {
		return value instanceof type;
	}

	public static isTypeOf<T>(value: unknown, type: string): value is T {
		// biome-ignore lint/suspicious/useValidTypeof: We are checking the type of the value
		return typeof value === type;
	}

	public static isEmptyString(value: string): boolean {
		return value.trim().length === 0;
	}

	public static isValidArray<T>(value: T[], validator: (value: T) => boolean): boolean {
		return Array.isArray(value) && value.every(validator);
	}

	public static isValidDomain(value: string): boolean {
		if (value === 'localhost') return true;

		return /\b((?=[a-z0-9-]{1,63}\.)(xn--)?[a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,63}\b/.test(value);
	}

	public static isValidBase64URL(value: string): boolean {
		return /^[\w-]+$/.test(value);
	}

	public static isLengthWithinRange(value: number, min: number, max: number): boolean {
		return value >= min && value <= max;
	}
}
