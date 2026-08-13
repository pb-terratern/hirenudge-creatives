import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export function createOauthState(secret: string): string {
  const nonce = randomBytes(24).toString("base64url");
  const signature = createHmac("sha256", secret).update(nonce).digest("base64url");
  return `${nonce}.${signature}`;
}

export function verifyOauthState(value: string, secret: string): boolean {
  const [nonce, signature] = value.split(".");
  if (!nonce || !signature) return false;
  const expected = createHmac("sha256", secret).update(nonce).digest();
  const received = Buffer.from(signature, "base64url");
  return received.length === expected.length && timingSafeEqual(received, expected);
}
