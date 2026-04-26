import { mapNotNullish } from "@std/collections";
import { blue, gray, red, yellow } from "@std/fmt/colors";

import { constantTextEncoder } from "#/global.ts";

import { env } from "./env.ts";

export class Logger {
  public static readonly level = {
    error: [1, red("ERROR")],
    warn: [2, yellow("WARN") + " "],
    info: [3, blue("INFO") + " "],
    debug: [4, gray("DEBUG")]
  } as const;

  public readonly source: string;

  public constructor(source?: string) {
    this.source = source ? gray(`[${source}]`) : "";
  }

  public error(...message: unknown[]): void {
    this.flush(Logger.level.error, message);
  }

  public warn(...message: unknown[]): void {
    this.flush(Logger.level.warn, message);
  }

  public info(...message: unknown[]): void {
    this.flush(Logger.level.info, message);
  }

  public debug(...message: unknown[]): void {
    this.flush(Logger.level.debug, message);
  }

  private flush([level, name]: (typeof Logger.level)[keyof typeof Logger.level], message: unknown[]): void {
    if (level > env.JSPB_LOG_VERBOSITY) return;

    let prefix = "";

    if (env.JSPB_LOG_TIME) {
      prefix +=
        gray(Temporal.Now.zonedDateTimeISO().toString({ timeZoneName: "never", fractionalSecondDigits: 3 })) + " ";
    }

    prefix += name;

    if (this.source) {
      prefix += " " + this.source;
    }

    const render = mapNotNullish(message, (item) => {
      if (item == null) return;

      if (typeof item === "string") {
        return `${prefix} ${item}`;
      }

      return `${prefix} ${Deno.inspect(item, {
        colors: true,
        strAbbreviateSize: 60,
        iterableLimit: 10
      })}`;
    });

    for (const line of render) {
      const data = constantTextEncoder.encode(line + "\n");

      if (level > 2) {
        Deno.stdout.writeSync(data);
      } else {
        Deno.stderr.writeSync(data);
      }
    }
  }
}
