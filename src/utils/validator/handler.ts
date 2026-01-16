import type { sValidator } from "@hono/standard-validator";
import { errorCodeValidation, errorThrow } from "../error.ts";

export const validatorHandler: Parameters<typeof sValidator>[2] = (res) => {
  if (res.success) return;

  return errorThrow(errorCodeValidation, res.error[0]?.message);
};
