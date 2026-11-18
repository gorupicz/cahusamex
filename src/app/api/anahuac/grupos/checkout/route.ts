// POST /api/anahuac/grupos/checkout { seats, plan } → { url } of a Stripe Checkout.
import { HttpError, json, sameOrigin } from '@/lib/server/core';
import { createGroupCheckout } from '@/lib/server/anahuac-groups';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    if (!sameOrigin(req)) throw new HttpError(403, 'forbidden');
    return await createGroupCheckout(req);
  } catch (err) {
    if (err instanceof HttpError) return json({ ok: false, reason: err.reason }, err.status);
    console.error('anahuac group checkout failed', err);
    return json({ ok: false, reason: 'unavailable' }, 503);
  }
}
