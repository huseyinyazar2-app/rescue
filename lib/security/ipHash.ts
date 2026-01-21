import { createHash } from "crypto";

export const hashIp = (ip: string, secret: string): string => {
  const normalizedIp = ip.trim();
  return createHash("sha256").update(`${secret}${normalizedIp}`).digest("hex");
};
