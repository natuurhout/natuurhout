/*
 * Quote requests (afsluitingscalculator, the free form on /offerte-aanvragen/
 * and "op bestelling" orders from the price lists), delivered to Natuurhout's
 * inbox through Cloudflare Email Sending (the EMAIL binding in wrangler.jsonc,
 * no API key). The customer's address is the Reply-To, so answering the mail
 * in the inbox answers the customer. Once that is sent, the customer gets a
 * confirmation with an overview of the request, whose Reply-To is
 * Natuurhout's inbox.
 *
 * Served by the Cloudflare Worker (worker/index.ts) at /api/offerte/.
 * Env (Worker vars, optional):
 *   QUOTE_TO    default info@natuurhout.be (comma separated)
 *   QUOTE_FROM  default "Natuurhout offerte <offerte@natuurhout.be>"
 *
 * Sending only works once natuurhout.be is onboarded to Email Sending
 * (`npx wrangler email sending enable natuurhout.be`, needs an active zone,
 * so after the Combell nameserver switch). Until then the binding rejects the
 * sender, this route answers 503 and the page falls back to opening the
 * customer's mail program.
 */

import { confirmationMail, internalMail, parsePhotos, parseQuote, type Mail } from "../src/lib/quote-email";

export interface OfferteEnv {
  EMAIL: SendEmail;
  QUOTE_TO?: string;
  QUOTE_FROM?: string;
}

const DEFAULT_FROM = "Natuurhout offerte <offerte@natuurhout.be>";
const MIN_FILL_MS = 3_000;

// Best effort per Worker isolate: enough to blunt a script hammering the form.
const recent = new Map<string, number[]>();
function rateLimited(ip: string): boolean {
  const now = Date.now();
  const window = recent.get(ip)?.filter((t) => now - t < 10 * 60_000) ?? [];
  window.push(now);
  recent.set(ip, window);
  return window.length > 5;
}

function str(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

/** "Name <addr>" or a bare address, as the binding wants it. */
function address(value: string): string | EmailAddress {
  const m = value.match(/^\s*(.*?)\s*<([^>]+)>\s*$/);
  return m ? { name: m[1].replace(/^"|"$/g, ""), email: m[2] } : value.trim();
}

/** Setup gaps (domain not onboarded, sender not allowed) rather than a lost quote. */
const NOT_CONFIGURED = new Set(["E_SENDER_NOT_VERIFIED", "E_SENDER_DOMAIN_NOT_AVAILABLE", "E_ACCOUNT_SUSPENDED"]);
const code = (error: unknown) => (error as { code?: string } | null)?.code ?? "";

export async function POST(request: Request, env: OfferteEnv) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Ongeldige aanvraag." }, { status: 400 });
  }

  // Honeypot and fill time: bots fill every field and submit instantly.
  // Pretend success so they learn nothing.
  if (str(body.website, 200) || Number(body.elapsedMs) < MIN_FILL_MS) {
    return Response.json({ ok: true });
  }

  const quote = parseQuote(body);
  if ("error" in quote) {
    return Response.json({ error: quote.error }, { status: 400 });
  }

  const ip =
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown";
  if (rateLimited(ip)) {
    return Response.json({ error: "Te veel aanvragen kort na elkaar. Probeer het later opnieuw." }, { status: 429 });
  }

  if (!env.EMAIL) {
    return Response.json({ error: "not-configured" }, { status: 503 });
  }

  const inbox = (env.QUOTE_TO || "info@natuurhout.be").split(",").map((s) => s.trim()).filter(Boolean);
  const from = address(env.QUOTE_FROM || DEFAULT_FROM);

  const send = (to: string[], replyTo: string, mail: Mail) =>
    env.EMAIL.send({
      from,
      to,
      replyTo,
      subject: mail.subject,
      text: mail.text,
      html: mail.html,
      attachments: mail.attachments,
    });

  // 1. The request itself, to Natuurhout. This one must not be lost.
  try {
    // Photos of the situation go to Natuurhout only, never back to the customer.
    await send(inbox, quote.email, internalMail(quote, quote.kind === "vraag" ? parsePhotos(body) : []));
  } catch (error) {
    if (NOT_CONFIGURED.has(code(error))) {
      console.warn("Email Sending not set up for the sender domain:", code(error), (error as Error).message);
      return Response.json({ error: "not-configured" }, { status: 503 });
    }
    console.error("Email Sending rejected the quote request", code(error), error);
    return Response.json({ error: "send-failed" }, { status: 502 });
  }

  // 2. Confirmation to the customer. Best effort: the request already arrived,
  // so a failure here is logged, never shown as a failed request.
  let confirmed = false;
  try {
    await send([quote.email], inbox[0], confirmationMail(quote));
    confirmed = true;
  } catch (error) {
    console.error("Confirmation not sent", code(error), error);
  }

  return Response.json({ ok: true, confirmed });
}
