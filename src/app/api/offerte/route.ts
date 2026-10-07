/*
 * Quote requests from the afsluitingscalculator, delivered to Natuurhout's
 * inbox through Resend (https://resend.com). The customer's address is the
 * Reply-To, so answering the mail in the inbox answers the customer.
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
 */

// Overridable only so the route can be exercised against a local stand-in.
const RESEND_URL = process.env.RESEND_API_URL || "https://api.resend.com/emails";
const DEFAULT_FROM = "Natuurhout offerte <offerte@natuurhout.be>";
const FALLBACK_FROM = "Natuurhout offerte <onboarding@resend.dev>";
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_TEXT = 20_000;
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

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
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

  const name = str(body.name, 200);
  const email = str(body.email, 200);
  const text = str(body.text, MAX_TEXT);
  if (!name || !EMAIL.test(email) || !text) {
    return Response.json({ error: "Naam, een geldig e-mailadres en de aanvraag zijn verplicht." }, { status: 400 });
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (rateLimited(ip)) {
    return Response.json({ error: "Te veel aanvragen kort na elkaar. Probeer het later opnieuw." }, { status: 429 });
  }

  const key = process.env.RESEND_API_KEY;
  if (!key) {
    return Response.json({ error: "not-configured" }, { status: 503 });
  }

  const to = (process.env.QUOTE_TO || "info@natuurhout.be").split(",").map((s) => s.trim()).filter(Boolean);
  const from = process.env.QUOTE_FROM || DEFAULT_FROM;
  const subject = `Offerteaanvraag afsluiting – ${name}`;
  const html = `<div style="font-family:system-ui,-apple-system,Segoe UI,Arial,sans-serif;font-size:14px;line-height:1.55;color:#303130">
<p style="margin:0 0 12px">Beantwoord deze mail om <strong>${escapeHtml(name)}</strong> (${escapeHtml(email)}) rechtstreeks te antwoorden.</p>
<pre style="white-space:pre-wrap;font-family:inherit;margin:0">${escapeHtml(text)}</pre>
</div>`;

  const send = (sender: string) =>
    fetch(RESEND_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: sender, to, reply_to: email, subject, text, html }),
      signal: AbortSignal.timeout(15_000),
    });

  try {
    let response = await send(from);
    if (!response.ok) {
      const detail = await response.text();
      // An unverified sender domain is a setup gap, not a lost quote.
      if (response.status === 403 && /domain/i.test(detail) && from !== FALLBACK_FROM) {
        console.warn("Sender domain not verified in Resend, sending from the onboarding address:", detail);
        response = await send(FALLBACK_FROM);
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

  return Response.json({ ok: true });
}
