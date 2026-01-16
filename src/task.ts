import { Logger } from "#util/console.ts";
import { constantStoreDispose } from "./global.ts";

const log: Logger = new Logger("task");

type TaskRegisterOptions = {
  name: string;
};

const trigger = async (callback: () => Promise<void> | void, options: TaskRegisterOptions): Promise<void> => {
  log.debug(`Running "${options.name}".`);

  try {
    await callback();
  } catch (error) {
    log.error(`Error while running "${options.name}"..:`, error);
  }

  log.debug(`Finished "${options.name}".`);
};

export const taskRegister = (
  expression: string,
  callback: () => Promise<void> | void,
  options: TaskRegisterOptions
): void => {
  const abort = new AbortController();

  const id = `__task-${options.name}`;

  constantStoreDispose.get(id)?.[1]();

  try {
    Deno.cron(options.name, expression, { signal: abort.signal }, () => trigger(callback, options));
  } catch (error) {
    log.error(`Failed to register "${options.name}"..:`, error);
  }

  constantStoreDispose.set(id, [100, async () => abort.abort()]);

  log.debug(`Registered "${options.name}".`);
};
