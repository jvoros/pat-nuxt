import { randomBytes, createHmac } from "node:crypto";

// Generates a random hex salt.
export const generateSalt = (): string => randomBytes(16).toString("hex");

// Hashes an access code with a site-specific salt using HMAC-SHA256.
// The salt prevents the same code from producing the same hash across sites.
export const hashCode = (code: string, salt: string): string =>
  createHmac("sha256", salt).update(code.trim().toLowerCase()).digest("hex");

// Returns true if the submitted code matches the stored hash.
export const verifyCode = (
  submitted: string,
  storedHash: string,
  salt: string,
): boolean => hashCode(submitted, salt) === storedHash;
