import crypto from "crypto";

export function hashIp(ip: string) {
  const secret = process.env.IP_HASH_SECRET;
  if (!secret) {
    throw new Error("Missing IP_HASH_SECRET");
  }
  return crypto.createHash("sha256").update(`${secret}:${ip}`).digest("hex");
}
