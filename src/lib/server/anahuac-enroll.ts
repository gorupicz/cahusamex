// Individual enrollment checkout for /anahuac (35%) and /cursoanahuac (20%),
// billed in LA BOLSA MX - Club with the site's STRIPE_SECRET_KEY.
//
// Checkout charges only the $1,500 enrollment (a one-time payment, so it shows
// no "por mes" or trial) and saves the card. When it completes, the webhook
// creates a monthly subscription for the program price in 2 payments, 1 and 2
// months after the enrollment, that ends itself after the second.
import { HttpError, type Row, env, json } from '@/lib/server/core';
import { EMAIL_RE } from '@/lib/directory/config';
import {
  PROGRAM_INSTALLMENTS,
  addMonthsUTC,
  anahuacProgram,
  formatCents,
  formatDay,
  formatMXN,
  groupOffer,
  installmentDates,
  offerClosed,
  programInstallmentCents,
  scholarships,
  todayInCancun,
  type Scholarship,
} from '@/data/anahuac';
import { stripe } from '@/lib/server/anahuac-groups';

export const ENROLL_KIND = 'anahuac_enroll';
const REST_KIND = 'anahuac_enroll_rest';
/** Half a month past the last payment: after it, well before the renewal that would follow. */
const CANCEL_MARGIN_MS = 15 * 24 * 3600 * 1000;

const offerOf = (id: unknown): Scholarship | null =>
  typeof id === 'string' && id in scholarships ? scholarships[id as Scholarship['id']] : null;

/** "2 pagos de $3,412.50 MXN … el 18 de diciembre de 2026 y el 18 de enero de 2027". */
function programPlan(beca: Scholarship, from: Date) {
  const each = formatCents(programInstallmentCents(beca));
  const [d1, d2] = installmentDates(PROGRAM_INSTALLMENTS + 1, from).slice(1).map(formatDay);
  return `El programa (${formatMXN(beca.tuition)} con beca) se cobra en ${PROGRAM_INSTALLMENTS} pagos de ${each} a la misma tarjeta, el ${d1} y el ${d2}, sin intereses`;
}

export async function createEnrollCheckout(req: Request) {
  const body = await req.json().catch(() => ({}));
  const beca = offerOf(body.offer);
  if (!beca) throw new HttpError(422, 'invalid');
  if (offerClosed(beca)) throw new HttpError(410, 'closed');
  if (!env.stripeKey) throw new HttpError(503, 'unavailable');

  const email = typeof body.email === 'string' && EMAIL_RE.test(body.email.trim()) ? body.email.trim() : '';
  const plan = programPlan(beca, todayInCancun());
  const meta = { kind: ENROLL_KIND, offer: beca.id };
  const params: Record<string, string> = {
    mode: 'payment',
    locale: 'es',
    customer_creation: 'always',
    // Saved for the 2 program payments the webhook schedules.
    'payment_intent_data[setup_future_usage]': 'off_session',
    'payment_intent_data[description]': `Inscripción · Certificación IA Anáhuac · Beca ${beca.discount}%`,
    'line_items[0][quantity]': '1',
    'line_items[0][price_data][currency]': 'mxn',
    'line_items[0][price_data][unit_amount]': String(beca.enrollment * 100),
    'line_items[0][price_data][product_data][name]':
      `Inscripción · Certificación IA Anáhuac · ${beca.label}: ${beca.discount}% de descuento`,
    'line_items[0][price_data][product_data][description]':
      `Inicio: ${anahuacProgram.facts.start}. Hoy pagas la inscripción. ${plan}.`,
    'custom_text[submit][message]': `Hoy se cobra la inscripción de ${formatMXN(beca.enrollment)}. ${plan}. Después no hay más cargos.`,
    success_url: `${env.siteUrl}/anahuac/gracias`,
    cancel_url: `${env.siteUrl}${beca.path}#inscripcion`,
    ...(email ? { customer_email: email } : {}),
  };
  for (const [k, v] of Object.entries(meta)) {
    params[`metadata[${k}]`] = v;
    params[`payment_intent_data[metadata][${k}]`] = v;
  }

  const session = await stripe<{ url: string }>('checkout/sessions', params);
  return json({ ok: true, url: session.url });
}

/** Creates the 2 program payments once the enrollment is paid. Safe to repeat: keyed on the session. */
async function scheduleProgramPayments(session: Row) {
  const beca = offerOf(session.metadata?.offer);
  if (!beca || session.payment_status !== 'paid') return;
  try {
    const full = await stripe(`checkout/sessions/${session.id}?expand[]=payment_intent`, {}, 'GET');
    const paymentMethod = full.payment_intent?.payment_method;
    const customer = typeof full.customer === 'string' ? full.customer : full.customer?.id;
    if (!paymentMethod || !customer) throw new Error('no saved payment method or customer');

    const paidAt = new Date(session.created * 1000);
    const first = addMonthsUTC(paidAt, 1);
    const cancelAt = addMonthsUTC(paidAt, PROGRAM_INSTALLMENTS).getTime() + CANCEL_MARGIN_MS;
    const sub = await stripe(
      'subscriptions',
      {
        customer,
        default_payment_method: paymentMethod,
        off_session: 'true',
        'items[0][price_data][currency]': 'mxn',
        'items[0][price_data][product]': groupOffer.stripeProduct,
        'items[0][price_data][unit_amount]': String(programInstallmentCents(beca)),
        'items[0][price_data][recurring][interval]': 'month',
        billing_cycle_anchor: String(Math.floor(first.getTime() / 1000)),
        proration_behavior: 'none',
        cancel_at: String(Math.floor(cancelAt / 1000)),
        description: `Certificación IA Anáhuac · Beca ${beca.discount}% · programa en ${PROGRAM_INSTALLMENTS} pagos (inscripción pagada ${formatDay(paidAt)})`,
        'metadata[kind]': REST_KIND,
        'metadata[offer]': beca.id,
        'metadata[checkout_session]': session.id,
      },
      'POST',
      `anahuac-enroll-${session.id}`,
    );
    console.log('anahuac enroll: program payments scheduled', session.id, sub.id, beca.id);
  } catch (err) {
    // The enrollment is paid but the program payments aren't scheduled: set them up by hand.
    console.error('anahuac enroll: FAILED to schedule program payments — set them up in Stripe by hand', session.id, err);
  }
}

/**
 * Called from the site's Stripe webhook for every checkout.session.completed.
 * Returns true when the event belongs to an Anáhuac landing (so Connect skips it).
 */
export async function handleEnrollCheckoutCompleted(session: Row): Promise<boolean> {
  if (session.metadata?.kind !== ENROLL_KIND) return false;
  await scheduleProgramPayments(session);
  return true;
}

/** Subscriptions created for Anáhuac purchases (groups and program payments) aren't Connect plans. */
export const isAnahuacObject = (obj: Row) => typeof obj?.metadata?.kind === 'string' && obj.metadata.kind.startsWith('anahuac');
