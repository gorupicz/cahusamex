// POST /api/anahuac/checkout { offer: "35" | "20", email } → { url } of a Stripe Checkout for the enrollment.
import { HttpError, json, sameOrigin } from '@/lib/server/core';
import { createEnrollCheckout } from '@/lib/server/anahuac-enroll';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    if (!sameOrigin(req)) throw new HttpError(403, 'forbidden');
    return await createEnrollCheckout(req);
  } catch (err) {
    if (err instanceof HttpError) return json({ ok: false, reason: err.reason }, err.status);
    console.error('anahuac enroll checkout failed', err);
    return json({ ok: false, reason: 'unavailable' }, 503);
  }
}
