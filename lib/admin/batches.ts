import { generatePin, generatePublicCode, hashPin } from "@/lib/tags";

export interface BatchTagPayload {
  public_code: string;
  pin: string;
  pin_hash: string;
}

export async function prepareBatchTags(quantity: number, existingCodes = new Set<string>()) {
  const tags: BatchTagPayload[] = [];
  const codes = new Set<string>(existingCodes);

  while (tags.length < quantity) {
    const public_code = generatePublicCode();
    if (codes.has(public_code)) {
      continue;
    }
    codes.add(public_code);
    const pin = generatePin();
    const pin_hash = await hashPin(pin);
    tags.push({ public_code, pin, pin_hash });
  }

  return tags;
}
