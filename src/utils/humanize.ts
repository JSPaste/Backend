const timeUnitsRegex = /^(\d+)([smhdwMy])$/;
const timeUnitMap: Record<string, keyof Temporal.Duration> = {
  s: "seconds",
  m: "minutes",
  h: "hours",
  d: "days",
  w: "weeks",
  M: "months",
  y: "years"
} as const;

const sizeUnitsRegex = /^(\d+(?:\.\d+)?)(b|[kmgtp]i?b)$/i;
const sizeUnits: Record<string, number> = {
  b: 1,
  kb: 1000,
  kib: 1024,
  mb: 1000 ** 2,
  mib: 1024 ** 2,
  gb: 1000 ** 3,
  gib: 1024 ** 3,
  tb: 1000 ** 4,
  tib: 1024 ** 4
} as const;

export const humanizeTime = (input: string): Temporal.Duration => {
  if (input === "0") {
    return Temporal.Duration.from({ seconds: 0 });
  }

  const [, value, unit] = timeUnitsRegex.exec(input) ?? [];
  if (!(value && unit)) {
    throw new Error(`Invalid time "${input}"`);
  }

  return Temporal.Duration.from({ [timeUnitMap[unit] as string]: Number.parseInt(value, 10) });
};

export const humanizeSize = (input: string): number => {
  if (input === "0") {
    return 0;
  }

  const [, value, unit] = sizeUnitsRegex.exec(input) ?? [];
  if (!(value && unit)) {
    throw new Error(`Invalid size "${input}"`);
  }

  return Number.parseFloat(value) * (sizeUnits[unit.toLowerCase()] ?? 0);
};
