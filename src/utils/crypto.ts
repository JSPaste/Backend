import { decodeAscii85, encodeAscii85 } from "@std/encoding";
import { createBLAKE3 } from "hash-wasm";

import { constantTextEncoder } from "#/global.ts";

const hasher = await createBLAKE3();

export const generateSalt = (length: number): Uint8Array<ArrayBuffer> => {
  return crypto.getRandomValues(new Uint8Array(length));
};

export const generateHash = (input: string, salt?: Uint8Array): { combo: string; hash: string } => {
  const defaultSalt = salt ?? generateSalt(4);

  hasher.init();
  hasher.update(defaultSalt);
  hasher.update(constantTextEncoder.encode(input));

  const encodedHash = encodeAscii85(hasher.digest("binary"), { standard: "Z85" });

  return {
    combo: `${encodedHash} ${encodeAscii85(defaultSalt, { standard: "Z85" })}`,
    hash: encodedHash
  };
};

export const verifyHash = (input: string, combo: string): boolean => {
  const [hash, salt] = combo.split(" ");
  if (!(hash && salt)) {
    throw new Error("Invalid hash combo");
  }

  const { hash: inputHash } = generateHash(input, decodeAscii85(salt, { standard: "Z85" }));

  return inputHash === hash;
};
