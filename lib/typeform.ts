import { createHmac, timingSafeEqual } from "crypto";

export function verifyTypeformSignature(rawBody: string, signatureHeader: string, secret: string): boolean {
  if (!signatureHeader || !signatureHeader.startsWith("sha256=")) {
    return false;
  }
  const provided = signatureHeader.replace("sha256=", "");
  const expected = createHmac("sha256", secret).update(rawBody).digest("base64");

  try {
    return timingSafeEqual(Buffer.from(provided), Buffer.from(expected));
  } catch {
    return false;
  }
}


