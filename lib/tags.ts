import bcrypt from "bcryptjs";
import crypto from "crypto";

export function generatePublicCode() {
  const chunk = () => crypto.randomBytes(2).toString("hex").toUpperCase();
  return `MXC-${chunk()}-${chunk()}`;
}

export function generatePin() {
  return crypto.randomInt(0, 1000000).toString().padStart(6, "0");
}

export async function hashPin(pin: string) {
  return bcrypt.hash(pin, 10);
}
