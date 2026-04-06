import crypto from "node:crypto";

export async function signWebhookPayload(payload: string, secret: string) {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}
