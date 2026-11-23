/*
 * Sends a shop e-mail to a customer through Email Sending (EMAIL binding),
 * from the quote sender, Reply-To Natuurhout's inbox, and a separate copy to
 * the inbox with Reply-To the customer (so answering the copy reaches them).
 */

import type { ShopMail } from "./mail";
import { binaryAttachments } from "../mail-attachments";

export type MailEnv = { EMAIL: SendEmail; QUOTE_TO?: string; QUOTE_FROM?: string };
export type Mailer = (to: string, mail: ShopMail) => Promise<void>;

const DEFAULT_FROM = "Natuurhout <offerte@natuurhout.be>";

function address(value: string): string | EmailAddress {
  const m = value.match(/^\s*(.*?)\s*<([^>]+)>\s*$/);
  return m ? { name: m[1].replace(/^"|"$/g, ""), email: m[2] } : value.trim();
}

export function makeMailer(env: MailEnv): Mailer | null {
  const binding = env.EMAIL;
  if (!binding) return null;
  const inbox = (env.QUOTE_TO || "info@natuurhout.be").split(",").map((s) => s.trim()).filter(Boolean);
  const fromValue = env.QUOTE_FROM || DEFAULT_FROM;
  return async (to, mail) => {
    // To the customer: their replies come to Natuurhout's inbox.
    await binding.send({
      from: address(fromValue),
      to: [to],
      replyTo: inbox[0],
      subject: mail.subject,
      text: mail.text,
      html: mail.html,
      attachments: binaryAttachments(mail.attachments),
    });
    if (mail.noCopy) return;
    // A copy for the inbox, the same mail with the PDF, but Reply-To the customer:
    // "Antwoorden" in Outlook writes to the customer, quoting what they received.
    // (A BCC copy carried the customer's Reply-To, so replying went to ourselves.)
    try {
      await binding.send({
        from: address(fromValue),
        to: inbox,
        replyTo: to,
        subject: mail.subject,
        text: mail.text,
        html: mail.html,
        attachments: binaryAttachments(mail.attachments),
      });
    } catch (error) {
      console.error("Inbox copy of a shop mail failed", mail.subject, error);
    }
  };
}
