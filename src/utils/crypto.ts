import { crypto } from "@std/crypto";
import { decodeAscii85, encodeAscii85 } from "@std/encoding";
import { constant } from "#/global.ts";

export const generateSalt = (length: number): Uint8Array<ArrayBuffer> => {
  return crypto.getRandomValues(new Uint8Array(length));
};

export const generateHash = async (input: string, salt?: Uint8Array) => {
  const defaultSalt = salt ?? generateSalt(4);

  const dataBytes = constant.textEncoder.encode(input);
  const combo = new Uint8Array(defaultSalt.length + dataBytes.length);
  combo.set(defaultSalt, 0);
  combo.set(dataBytes, defaultSalt.length);

  const hash = await crypto.subtle.digest("BLAKE3", combo);
  const encodedHash = encodeAscii85(hash, { standard: "Z85" });

  return {
    combo: `${encodedHash} ${encodeAscii85(defaultSalt, { standard: "Z85" })}`,
    hash: encodedHash,
    salt: defaultSalt
  };
};

export const verifyHash = async (input: string, combo: string): Promise<boolean> => {
  const [hash, salt] = combo.split(" ");
  if (!(hash && salt)) {
    throw new Error("Invalid hash combo");
  }

  const { hash: inputHash } = await generateHash(input, decodeAscii85(salt, { standard: "Z85" }));

  return inputHash === hash;
};
