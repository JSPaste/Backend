import { constantNanoid } from "#/global.ts";

export const generateToken = (id: string): string => {
  const noise = constantNanoid(32);

  return `${id}.${noise}`;
};
