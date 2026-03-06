import crypto from "crypto";

export function id(prefix: string) {
  return prefix + "_" + crypto.randomBytes(12).toString("hex");
}
