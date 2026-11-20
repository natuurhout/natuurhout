/*
 * Our mail builders keep attachments as base64 strings. Email Sending takes a
 * string `content` as the file's text, not as base64, so the logo, mascot,
 * photos and PDFs arrived as base64 text (broken images in every mail client).
 * Decode them to bytes right before EMAIL.send().
 */

import type { MailAttachment } from "../src/lib/quote-email";

function fromBase64(b64: string): Uint8Array {
  const bin = atob(b64.replace(/\s+/g, ""));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

export function binaryAttachments(attachments: MailAttachment[]): EmailAttachment[] {
  return attachments.map((a) => ({ ...a, content: fromBase64(a.content) }));
}
