import { constant } from "#/global.ts";

export const generateToken = (id: string): string => {
  const noise = constant.nanoid(32);

  return `${id}.${noise}`;
};
