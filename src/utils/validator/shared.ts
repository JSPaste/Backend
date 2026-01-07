import { type } from "arktype";

export const validatorCreationTimestamp = type.keywords.string.date.iso.root.configure({
  description: "The ISO 8601 timestamp when the resource was created",
  examples: ["2026-01-01T00:00:00.000Z"]
});
