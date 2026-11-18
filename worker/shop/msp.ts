/*
 * MultiSafepay (docs.multisafepay.com, API v1 JSON). Only what the checkout
 * needs: create a redirect order (the hosted payment page, every method that
 * is switched on for the site: Bancontact, cards, KBC/CBC, Belfius, iDEAL…),
 * read an order's status, and check a webhook's signature.
 *
 * Keys are Worker secrets, never in the repo: MSP_API_KEY_TEST (test account,
 * testapi.multisafepay.com) and MSP_API_KEY_LIVE. Which one is used is chosen
 * in the backend (Instellingen → Online betalen) and stored per order.
 */

export type MspMode = "test" | "live";

export interface MspEnv {
  MSP_API_KEY_TEST?: string;
  MSP_API_KEY_LIVE?: string;
}

const BASE: Record<MspMode, string> = {
  test: "https://testapi.multisafepay.com/v1/json",
  live: "https://api.multisafepay.com/v1/json",
};

export const mspKey = (env: MspEnv, mode: MspMode) => (mode === "live" ? env.MSP_API_KEY_LIVE : env.MSP_API_KEY_TEST)?.trim() || "";

export class MspError extends Error {}

async function call<T>(env: MspEnv, mode: MspMode, method: "GET" | "POST", path: string, body?: unknown): Promise<T> {
  const key = mspKey(env, mode);
  if (!key) throw new MspError(`MultiSafepay ${mode}-sleutel ontbreekt`);
  const res = await fetch(`${BASE[mode]}${path}${path.includes("?") ? "&" : "?"}api_key=${encodeURIComponent(key)}`, {
    method,
    headers: { accept: "application/json", ...(body ? { "content-type": "application/json" } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = (await res.json().catch(() => null)) as { success?: boolean; data?: T; error_code?: number; error_info?: string } | null;
  if (!res.ok || !json?.success || !json.data) {
    throw new MspError(`MultiSafepay ${res.status}${json?.error_code ? ` (${json.error_code})` : ""}: ${json?.error_info ?? "onbekende fout"}`);
  }
  return json.data;
}

export type MspCustomer = {
  locale: "nl_BE" | "fr_BE";
  ip_address?: string;
  first_name: string;
  last_name: string;
  address1?: string;
  house_number?: string;
  zip_code?: string;
  city?: string;
  country: string;
  phone?: string;
  email: string;
};

export function createPayment(
  env: MspEnv,
  mode: MspMode,
  input: { order_id: string; amount: number; description: string; customer: MspCustomer; notification_url: string; redirect_url: string; cancel_url: string; days_active: number },
) {
  return call<{ order_id: string; payment_url: string }>(env, mode, "POST", "/orders", {
    type: "redirect",
    order_id: input.order_id,
    currency: "EUR",
    amount: Math.round(input.amount * 100),
    description: input.description.slice(0, 200),
    days_active: input.days_active,
    payment_options: {
      notification_url: input.notification_url,
      notification_method: "POST",
      redirect_url: input.redirect_url,
      cancel_url: input.cancel_url,
      close_window: false,
    },
    customer: input.customer,
  });
}

export type MspOrder = {
  order_id: string;
  status: string;
  financial_status?: string;
  transaction_id?: string | number;
  amount: number; // cents
  payment_details?: { type?: string };
};

export const getPayment = (env: MspEnv, mode: MspMode, orderId: string) => call<MspOrder>(env, mode, "GET", `/orders/${encodeURIComponent(orderId)}`);

/**
 * Webhook signature: Auth header = base64("timestamp:hex(HMAC-SHA512(timestamp + ':' + body, api key))").
 * Returns true when it matches the given key.
 */
export async function validSignature(auth: string | null, body: string, key: string): Promise<boolean> {
  if (!auth || !key) return false;
  let decoded: string;
  try {
    decoded = atob(auth.trim());
  } catch {
    return false;
  }
  const i = decoded.indexOf(":");
  if (i < 1) return false;
  const timestamp = decoded.slice(0, i);
  const signature = decoded.slice(i + 1).trim().toLowerCase();
  const hmacKey = await crypto.subtle.importKey("raw", new TextEncoder().encode(key), { name: "HMAC", hash: "SHA-512" }, false, ["sign"]);
  const mac = new Uint8Array(await crypto.subtle.sign("HMAC", hmacKey, new TextEncoder().encode(`${timestamp}:${body}`)));
  const expected = [...mac].map((b) => b.toString(16).padStart(2, "0")).join("");
  if (expected.length !== signature.length) return false;
  let diff = 0;
  for (let j = 0; j < expected.length; j++) diff |= expected.charCodeAt(j) ^ signature.charCodeAt(j);
  return diff === 0;
}

/** Readable name for the method MultiSafepay reports. */
export function methodName(type: string | null | undefined): string {
  const names: Record<string, string> = {
    MISTERCASH: "Bancontact",
    VISA: "Visa",
    MASTERCARD: "Mastercard",
    MAESTRO: "Maestro",
    AMEX: "American Express",
    CREDITCARD: "Kaart",
    IDEAL: "iDEAL",
    KBC: "KBC/CBC",
    CBC: "KBC/CBC",
    BELFIUS: "Belfius",
    BANKTRANS: "Overschrijving (MultiSafepay)",
    APPLEPAY: "Apple Pay",
    GOOGLEPAY: "Google Pay",
    PAYPAL: "PayPal",
  };
  return type ? (names[type.toUpperCase()] ?? type) : "";
}
