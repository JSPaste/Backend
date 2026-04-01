import { assertStrictEquals, assertThrows } from "@std/assert";

import { humanizeSize, humanizeTime } from "#util/humanize.ts";

Deno.test("humanizeTime", () => {
  const basic = humanizeTime("1d");
  assertStrictEquals(basic.total("seconds"), 86_400);

  // case sensitive
  const sensitiveMinutes = humanizeTime("1m");
  const sensitiveMonths = humanizeTime("1M");
  assertStrictEquals(sensitiveMinutes.minutes, 1);
  assertStrictEquals(sensitiveMonths.months, 1);

  const zero = humanizeTime("0");
  assertStrictEquals(zero.total("seconds"), 0);

  const zeroUnit = humanizeTime("0d");
  assertStrictEquals(zeroUnit.total("milliseconds"), 0);

  // invalid unit
  assertThrows(() => humanizeTime("1x"));

  // spaces in between
  assertThrows(() => humanizeTime("1 d"));

  // float
  assertThrows(() => humanizeTime("1.9d"));

  // multiple units
  assertThrows(() => humanizeTime("1d 50m"));
});

Deno.test("humanizeSize", () => {
  const basic = humanizeSize("1gb");
  assertStrictEquals(basic, 1_000_000_000);

  const basicBinary = humanizeSize("1gib");
  assertStrictEquals(basicBinary, 1_073_741_824);

  // case insensitive
  const insensitive = humanizeSize("1kIb");
  assertStrictEquals(insensitive, 1024);

  // float
  const floatValue = humanizeSize("1.5mb");
  assertStrictEquals(floatValue, 1_500_000);

  const zero = humanizeSize("0");
  assertStrictEquals(zero, 0);

  const zeroUnit = humanizeSize("0mb");
  assertStrictEquals(zeroUnit, 0);

  // invalid unit
  assertThrows(() => humanizeSize("1xib"));

  // spaces in between
  assertThrows(() => humanizeSize("1 gb"));

  // multiple units
  assertThrows(() => humanizeTime("1gb 50mb"));
});
