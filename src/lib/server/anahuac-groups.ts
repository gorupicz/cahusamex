// Group checkout for the Anáhuac certification (/grupos-anahuac), billed in
// LA BOLSA MX - Club with the site's STRIPE_SECRET_KEY.
//
// 1 pago → a one-time Checkout payment for every seat.
// 2–3 pagos → a subscription: the first installment is a one-time line item
// charged at checkout, the recurring item is anchored to Dec 30 with no
// proration, so Stripe charges Dec 30 and (for 3 pagos) Jan 30. Checkout can't
// set an end date, so the webhook sets cancel_at right after the last charge.
import { HttpError, type Row, env, json } from '@/lib/server/core';
import { groupOffer, installmentCents, type GroupPlanId } from '@/data/anahuac';

export const GROUP_KIND = 'anahuac_group';

/** Noon in Cancún (17:00 UTC) on the 30th, so no timezone puts it on another day. */
const ANCHOR = Date.UTC(2026, 11, 30, 17) / 1000;
/** A few hours before the renewal that would follow the last installment. */
const CANCEL_AT: Record<string, number> = {
  '2': Date.UTC(2027, 0, 30, 12) / 1000,
  '3': Date.UTC(2027, 1, 28, 12) / 1000,
};

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

  const amount = String(installmentCents(plan.installments));
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
    'line_items[0][price_data][product]': groupOffer.stripeProduct,
    'line_items[0][price_data][unit_amount]': amount,
  };
  for (const [k, v] of Object.entries(meta)) params[`metadata[${k}]`] = v;

  if (plan.installments === 1) {
    params.mode = 'payment';
    params.customer_creation = 'always';
    for (const [k, v] of Object.entries(meta)) params[`payment_intent_data[metadata][${k}]`] = v;
  } else {
    params.mode = 'subscription';
    // Line 0 is the recurring installment (Dec 30, Jan 30); line 1 the one charged now.
    params['line_items[0][price_data][recurring][interval]'] = 'month';
    params['line_items[1][quantity]'] = String(seats);
    params['line_items[1][price_data][currency]'] = 'mxn';
    params['line_items[1][price_data][product]'] = groupOffer.stripeProduct;
    params['line_items[1][price_data][unit_amount]'] = amount;
    params['subscription_data[billing_cycle_anchor]'] = String(ANCHOR);
    params['subscription_data[proration_behavior]'] = 'none';
    params['subscription_data[description]'] =
      `Certificación IA Anáhuac · ${seats} asientos · ${plan.label}: ${plan.dates.join(', ')}`;
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
  const cancelAt = CANCEL_AT[session.metadata.plan];
  if (session.mode === 'subscription' && session.subscription && cancelAt) {
    try {
      await stripe(`subscriptions/${session.subscription}`, {
        cancel_at: String(cancelAt),
        proration_behavior: 'none',
      });
      console.log('anahuac group: installments end set', session.subscription, session.metadata.plan);
    } catch (err) {
      // Without this the subscription keeps billing monthly: it must be fixed by hand.
      console.error('anahuac group: FAILED to set cancel_at — set it in Stripe by hand', session.subscription, err);
    }
  }
  return true;
}
