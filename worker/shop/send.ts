/*
 * Sends a shop e-mail to a customer through Email Sending (EMAIL binding),
 * from the quote sender, Reply-To Natuurhout's inbox, BCC to the inbox so
 * there is a copy of every payment request and invoice.
 */

import type { ShopMail } from "./mail";

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
    await binding.send({
      from: address(fromValue),
      to: [to],
      bcc: inbox,
      replyTo: inbox[0],
      subject: mail.subject,
      text: mail.text,
      html: mail.html,
      attachments: mail.attachments,
    });
  };
}
