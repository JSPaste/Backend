import chalk from 'chalk';
import log from 'loglevel';

export const logger = {
	set: (level: number | undefined) => {
		switch (level) {
			case 0: {
				log.setLevel('error');
				break;
			}
			case 1: {
				log.setLevel('warn');
				break;
			}
			case 2: {
				log.setLevel('info');
				break;
			}
			case 3: {
				log.setLevel('debug');
				break;
			}
			default: {
				log.setLevel('info');
			}
		}
	},

	error: (...msg: any[]) => {
		log.error(chalk.red('[ERROR]'), ...msg);
	},

	warn: (...msg: any[]) => {
		log.warn(chalk.yellow('[WARN]'), ...msg);
	},

	info: (...msg: any[]) => {
		log.info(chalk.blue('[INFO]'), ...msg);
	},

	debug: (...msg: any[]) => {
		log.debug(chalk.gray('[DEBUG]'), ...msg);
	}
} as const;
