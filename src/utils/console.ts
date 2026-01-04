import { mapNotNullish } from "@std/collections";
import { blue, gray, red, yellow } from "@std/fmt/colors";
import { constant } from "#/global.ts";

export class Logger {
  public static readonly level = {
    none: [0, null],
    error: [1, red],
    warn: [2, yellow],
    info: [3, blue],
    debug: [4, gray]
  } as const;

  public readonly source: string;

  public constructor(source = "common") {
    this.source = source;
  }

  public error(...message: unknown[]): void {
    this.flush("error", message);
  }

  public warn(...message: unknown[]): void {
    this.flush("warn", message);
  }

  public info(...message: unknown[]): void {
    this.flush("info", message);
  }

  public debug(...message: unknown[]): void {
    this.flush("debug", message);
  }

  private flush(level: Exclude<keyof typeof Logger.level, "none">, message: unknown[]): void {
    const [levelNumber, color] = Logger.level[level];

    if (levelNumber > constant.env.JSPB_LOG_VERBOSITY) return;

    const prefix: string[] = [];

    if (constant.env.JSPB_LOG_TIME) {
      const temporalLocal = Temporal.Now.zonedDateTimeISO();
      const temporalYear = temporalLocal.year;
      const temporalMonth = temporalLocal.month.toString().padStart(2, "0");
      const temporalDay = temporalLocal.day.toString().padStart(2, "0");
      const temporalHour = temporalLocal.hour.toString().padStart(2, "0");
      const temporalMinute = temporalLocal.minute.toString().padStart(2, "0");
      const temporalSecond = temporalLocal.second.toString().padStart(2, "0");
      const temporalMillisecond = temporalLocal.millisecond.toString().padStart(3, "0");
      const temporalOffset = temporalLocal.offset;

      prefix.push(
        gray(
          `${temporalYear}-${temporalMonth}-${temporalDay}T${temporalHour}:${temporalMinute}:${temporalSecond}.${temporalMillisecond + temporalOffset}`
        )
      );
    }

    prefix.push(color(level.toUpperCase().padEnd(5)));
    prefix.push(gray(`[${this.source}]`));

    const prefixString = prefix.join(" ");

    const render = mapNotNullish(message, (item) => {
      // biome-ignore lint/nursery/noEqualsToNull: expected
      if (item == null) return;

      if (typeof item === "string") {
        return `${prefixString} ${item}`;
      }

      return `${prefixString} ${Deno.inspect(item, {
        colors: true,
        strAbbreviateSize: 60,
        iterableLimit: 10
      })}`;
    });

    for (const line of render) {
      // biome-ignore lint/suspicious/noConsole: logger
      console[level](line);
    }
  }
}
