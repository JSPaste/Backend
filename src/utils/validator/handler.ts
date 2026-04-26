import type { sValidator } from "@hono/standard-validator";

import { ErrorCode, errorThrow } from "../error.ts";

export const validatorHandler: Parameters<typeof sValidator>[2] = (res) => {
  if (res.success) return;

  return errorThrow(ErrorCode.Validation, res.error[0]?.message);
};
