import crypto from "crypto";

// AES-256-GCM encryption for anything sensitive we must store at rest
// (LinkedIn/Instagram session cookies). SESSION_ENCRYPTION_KEY must be a
// 32-byte value — generate with: openssl rand -hex 32
function getKey(): Buffer {
  const raw = process.env.SESSION_ENCRYPTION_KEY;
  if (!raw) throw new Error("SESSION_ENCRYPTION_KEY is not set");
  const key = Buffer.from(raw, "hex");
  if (key.length !== 32) throw new Error("SESSION_ENCRYPTION_KEY must be a 32-byte hex string (64 hex chars)");
  return key;
}

export function encryptSecret(plaintext: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString("base64");
}

export function decryptSecret(payload: string): string {
  const buf = Buffer.from(payload, "base64");
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const encrypted = buf.subarray(28);
  const decipher = crypto.createDecipheriv("aes-256-gcm", getKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}
