import chalk from 'chalk';
import log from 'loglevel';

export class Logger {
	public static init(level: log.LogLevelNames) {
		log.setLevel(level || 'info');
	}

	public static debug(...msg: any[]) {
		log.debug(chalk.gray('[DEBUG]'), ...msg);
	}

	public static info(...msg: any[]) {
		log.info(chalk.blue('[INFO]'), ...msg);
	}

	public static warn(...msg: any[]) {
		log.warn(chalk.yellow('[WARN]'), ...msg);
	}

	public static error(...msg: any[]) {
		log.error(chalk.red('[ERROR]'), ...msg);
	}
}
