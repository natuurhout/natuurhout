/*
 * Quote requests from the afsluitingscalculator, delivered to Natuurhout's
 * inbox through Resend (https://resend.com). The customer's address is the
 * Reply-To, so answering the mail in the inbox answers the customer. Once that
 * is sent, the customer gets a confirmation with an overview of the request,
 * whose Reply-To is Natuurhout's inbox.
 *
 * Env (Vercel → Settings → Environment Variables):
 *   RESEND_API_KEY  required; without it this route answers 503 and the page
 *                   falls back to opening the customer's mail program
 *   QUOTE_TO        optional, default info@natuurhout.be (comma separated)
 *   QUOTE_FROM      optional, default "Natuurhout offerte <offerte@natuurhout.be>"
 *
 * offerte@natuurhout.be only sends once natuurhout.be is verified in Resend
 * (Domains → DNS records). Until then Resend refuses that sender, and the
 * request is retried from Resend's own onboarding address, so quotes keep
 * arriving and the switch happens by itself the moment the domain verifies.
 * Resend only lets that onboarding address mail the account owner, so no
 * customer confirmation goes out until the domain is verified.
 */

import { confirmationMail, internalMail, parseQuote, type Mail } from "@/lib/quote-email";

// Overridable only so the route can be exercised against a local stand-in.
const RESEND_URL = process.env.RESEND_API_URL || "https://api.resend.com/emails";
const DEFAULT_FROM = "Natuurhout offerte <offerte@natuurhout.be>";
const FALLBACK_FROM = "Natuurhout offerte <onboarding@resend.dev>";
const MIN_FILL_MS = 3_000;

// Best effort per serverless instance: enough to blunt a script hammering the form.
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

export async function POST(request: Request) {
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

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (rateLimited(ip)) {
    return Response.json({ error: "Te veel aanvragen kort na elkaar. Probeer het later opnieuw." }, { status: 429 });
  }

  const key = process.env.RESEND_API_KEY;
  if (!key) {
    return Response.json({ error: "not-configured" }, { status: 503 });
  }

  const inbox = (process.env.QUOTE_TO || "info@natuurhout.be").split(",").map((s) => s.trim()).filter(Boolean);
  const from = process.env.QUOTE_FROM || DEFAULT_FROM;

  const send = (sender: string, to: string[], replyTo: string, mail: Mail) =>
    fetch(RESEND_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: sender,
        to,
        reply_to: replyTo,
        subject: mail.subject,
        text: mail.text,
        html: mail.html,
        attachments: mail.attachments,
      }),
      signal: AbortSignal.timeout(15_000),
    });

  // 1. The request itself, to Natuurhout. This one must not be lost.
  let sender = from;
  try {
    const mail = internalMail(quote);
    let response = await send(sender, inbox, quote.email, mail);
    if (!response.ok) {
      const detail = await response.text();
      // An unverified sender domain is a setup gap, not a lost quote.
      if (response.status === 403 && /domain/i.test(detail) && from !== FALLBACK_FROM) {
        console.warn("Sender domain not verified in Resend, sending from the onboarding address:", detail);
        sender = FALLBACK_FROM;
        response = await send(sender, inbox, quote.email, mail);
        if (!response.ok) {
          console.error("Resend rejected the quote request", response.status, await response.text());
          return Response.json({ error: "send-failed" }, { status: 502 });
        }
      } else {
        console.error("Resend rejected the quote request", response.status, detail);
        return Response.json({ error: "send-failed" }, { status: 502 });
      }
    }
  } catch (error) {
    console.error("Resend unreachable", error);
    return Response.json({ error: "send-failed" }, { status: 502 });
  }

  // 2. Confirmation to the customer. Best effort: the request already arrived,
  // so a failure here is logged, never shown as a failed request.
  let confirmed = false;
  if (sender !== FALLBACK_FROM) {
    try {
      const response = await send(sender, [quote.email], inbox[0], confirmationMail(quote));
      confirmed = response.ok;
      if (!response.ok) console.error("Resend rejected the confirmation", response.status, await response.text());
    } catch (error) {
      console.error("Confirmation not sent", error);
    }
  }

  return Response.json({ ok: true, confirmed });
}
