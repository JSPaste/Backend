import { decodeAscii85, encodeAscii85 } from "@std/encoding";
import type { EncodeAscii85Options } from "@std/encoding/ascii85";
import { createHasher } from "blake3-jit";

import { constantTextEncoder } from "#/global.ts";

const hasher = createHasher();

const encoderOptions: EncodeAscii85Options = { standard: "Z85" };

export const generateSalt = (length: number): Uint8Array<ArrayBuffer> => {
  return crypto.getRandomValues(new Uint8Array(length));
};

export const generateHash = (input: string, salt?: Uint8Array): { combo: string; hash: string } => {
  const defaultSalt = salt ?? generateSalt(4);

  hasher.reset();
  hasher.update(defaultSalt);
  hasher.update(constantTextEncoder.encode(input));

  const encodedHash = encodeAscii85(hasher.finalize(), encoderOptions);

  return {
    combo: `${encodedHash} ${encodeAscii85(defaultSalt, encoderOptions)}`,
    hash: encodedHash
  };
};

export const verifyHash = (input: string, combo: string): boolean => {
  const comboSeparatorIndex = combo.indexOf(" ");
  if (comboSeparatorIndex === -1) {
    throw new Error("Invalid hash combo");
  }

  const hash = combo.slice(0, comboSeparatorIndex);
  const salt = combo.slice(comboSeparatorIndex + 1);

  if (!(hash && salt)) {
    throw new Error("Invalid hash combo");
  }

  const { hash: inputHash } = generateHash(input, decodeAscii85(salt, encoderOptions));

  return inputHash === hash;
};
