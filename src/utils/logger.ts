import { colors } from '@x-util/colors.ts';

export enum LogLevels {
	none = 0,
	error = 1,
	warn = 2,
	info = 3,
	debug = 4
}

let logLevel: LogLevels = LogLevels.info;

export const logger = {
	set: (level: LogLevels): void => {
		logLevel = level;
	},

	error: (...text: unknown[]): void => {
		if (logLevel >= LogLevels.error) {
			console.error(colors.gray('[BACKEND]'), colors.red('[ERROR]'), text.join('\n'));
		}
	},

	warn: (...text: unknown[]): void => {
		if (logLevel >= LogLevels.warn) {
			console.warn(colors.gray('[BACKEND]'), colors.yellow('[WARN]'), text.join('\n'));
		}
	},

	info: (...text: unknown[]): void => {
		if (logLevel >= LogLevels.info) {
			console.info(colors.gray('[BACKEND]'), colors.blue('[INFO]'), text.join('\n'));
		}
	},

	debug: (...text: unknown[]): void => {
		if (logLevel >= LogLevels.debug) {
			console.debug(colors.gray('[BACKEND]'), colors.gray('[DEBUG]'), text.join('\n'));
		}
	}
} as const;
