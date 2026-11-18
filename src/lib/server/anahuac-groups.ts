// Group checkout for the Anáhuac certification (/grupos-anahuac), billed in
// LA BOLSA MX - Club with the site's STRIPE_SECRET_KEY.
//
// 1 pago → a one-time Checkout payment for every seat.
// 2–3 pagos → a plain monthly subscription: the first installment is charged
// at checkout and the rest on the same day of the following months (Nov 18 →
// Dec 18 → Jan 18). Checkout can't set an end date, so the webhook sets
// cancel_at between the last installment and the renewal that would follow.
import { HttpError, type Row, env, json } from '@/lib/server/core';
import {
  addMonthsUTC,
  formatDay,
  groupOffer,
  installmentCents,
  installmentDates,
  listEs,
  todayInCancun,
  type GroupPlanId,
} from '@/data/anahuac';

export const GROUP_KIND = 'anahuac_group';

const PRODUCT_NAME = 'Certificación IA Anáhuac (grupos)';
/** Half a month past the last installment: clear of month-length clamping, well before the next renewal. */
const CANCEL_MARGIN_MS = 15 * 24 * 3600 * 1000;

async function stripe<T = Row>(path: string, params: Record<string, string> = {}, method = 'POST'): Promise<T> {
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    method,
    headers: { Authorization: `Bearer ${env.stripeKey}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: method === 'GET' ? undefined : new URLSearchParams(params),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(`stripe ${path} ${res.status}: ${JSON.stringify(body.error ?? body)}`);
  return body as T;
}

const pageUrl = (path = '') => `${env.siteUrl}/grupos-anahuac${path}`;

export async function createGroupCheckout(req: Request) {
  if (Date.now() >= Date.parse(groupOffer.closesAt)) throw new HttpError(410, 'closed');
  const body = await req.json().catch(() => ({}));
  const seats = Number(body.seats);
  const plan = groupOffer.plans.find((p) => p.id === body.plan);
  if (!Number.isInteger(seats) || seats < groupOffer.minSeats || seats > groupOffer.maxSeats || !plan) {
    throw new HttpError(422, 'invalid');
  }
  if (!env.stripeKey) throw new HttpError(503, 'unavailable');

  const n = plan.installments;
  const meta = { kind: GROUP_KIND, seats: String(seats), plan: plan.id as GroupPlanId };
  const params: Record<string, string> = {
    locale: 'es',
    'phone_number_collection[enabled]': 'true',
    'custom_fields[0][key]': 'empresa',
    'custom_fields[0][label][type]': 'custom',
    'custom_fields[0][label][custom]': 'Empresa',
    'custom_fields[0][type]': 'text',
    success_url: pageUrl('/gracias'),
    cancel_url: pageUrl('#inscripcion'),
    'line_items[0][quantity]': String(seats),
    'line_items[0][price_data][currency]': 'mxn',
    'line_items[0][price_data][unit_amount]': String(installmentCents(n)),
  };
  for (const [k, v] of Object.entries(meta)) params[`metadata[${k}]`] = v;

  if (n === 1) {
    params.mode = 'payment';
    params.customer_creation = 'always';
    params['line_items[0][price_data][product]'] = groupOffer.stripeProduct;
    for (const [k, v] of Object.entries(meta)) params[`payment_intent_data[metadata][${k}]`] = v;
  } else {
    const later = installmentDates(n, todayInCancun()).slice(1).map(formatDay);
    const rest = `${n - 1 === 1 ? 'El otro se carga solo' : `Los otros ${n - 1} se cargan solos`} a la misma tarjeta el ${listEs(later)}`;
    params.mode = 'subscription';
    // Its own name: Checkout shows a subscription as "por mes", so the line says it's N payments, then nothing.
    params['line_items[0][price_data][product_data][name]'] = `${PRODUCT_NAME} · ${n} pagos mensuales sin intereses`;
    params['line_items[0][price_data][product_data][description]'] =
      `Hoy se cobra el pago 1 de ${n}. ${rest}. Después no hay más cargos.`;
    params['line_items[0][price_data][recurring][interval]'] = 'month';
    params['custom_text[submit][message]'] =
      `Hoy se cobra el pago 1 de ${n}. ${rest}, sin intereses. Después no hay más cargos.`;
    params['subscription_data[description]'] =
      `Certificación IA Anáhuac · ${seats} asientos · ${n} pagos mensuales: hoy, ${listEs(later)}`;
    for (const [k, v] of Object.entries(meta)) params[`subscription_data[metadata][${k}]`] = v;
  }

  const session = await stripe<{ url: string }>('checkout/sessions', params);
  return json({ ok: true, url: session.url });
}

/**
 * Called from the site's Stripe webhook for every checkout.session.completed.
 * Returns true when the event was a group purchase (so Connect skips it).
 */
export async function handleGroupCheckoutCompleted(session: Row): Promise<boolean> {
  if (session.metadata?.kind !== GROUP_KIND) return false;
  const n = Number(session.metadata.plan);
  if (session.mode === 'subscription' && session.subscription && n > 1) {
    try {
      const sub = await stripe(`subscriptions/${session.subscription}`, {}, 'GET');
      const anchor = new Date((sub.billing_cycle_anchor ?? sub.start_date) * 1000);
      const cancelAt = Math.floor((addMonthsUTC(anchor, n - 1).getTime() + CANCEL_MARGIN_MS) / 1000);
      await stripe(`subscriptions/${session.subscription}`, {
        cancel_at: String(cancelAt),
        proration_behavior: 'none',
      });
      console.log('anahuac group: installments end set', session.subscription, n, new Date(cancelAt * 1000).toISOString());
    } catch (err) {
      // Without this the subscription keeps billing monthly: it must be fixed by hand.
      console.error('anahuac group: FAILED to set cancel_at — set it in Stripe by hand', session.subscription, err);
    }
  }
  return true;
}
