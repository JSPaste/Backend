import { constantNanoid } from "../global.mts";

export const generateToken = (id: string): string => {
  const noise = constantNanoid(32);

  return `${id}.${noise}`;
};
