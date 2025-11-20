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

/**
 * Extract Typeform response URL from the stored document content
 * Returns a URL to view the response in Typeform admin panel, or null if not found
 */
export function extractTypeformResponseUrl(content: unknown): string | null {
  if (!content || typeof content !== "object") return null;
  
  const root = content as Record<string, unknown>;
  const formResponse = root.form_response as unknown;
  
  if (formResponse && typeof formResponse === "object") {
    const fr = formResponse as {
      form_id?: string;
      response_id?: string;
      token?: string;
    };
    
    const formId = fr.form_id;
    const responseId = fr.response_id || fr.token;
    
    if (formId && responseId) {
      return `https://admin.typeform.com/form/${formId}/results#responses/${responseId}`;
    }
  }
  
  return null;
}


