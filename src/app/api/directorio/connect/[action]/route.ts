// /api/directorio/connect/*: Connect. Under /api/directorio so the directory session cookie
// (Path=/api/directorio) comes along. The Stripe webhook is the one route without a cookie and
// without the same-origin check: Stripe signs it instead.
import { HttpError, backendReady, json, sameOrigin, sessionEmail } from '@/lib/server/core';
import { handleConnect, isWebhook } from '@/lib/server/connect';

export const dynamic = 'force-dynamic';
// A search waits for Claude (ranking plus parallel descriptions): give it room.
export const maxDuration = 180;

async function handle(req: Request, { params }: { params: Promise<{ action: string }> }) {
  const { action } = await params;
  try {
    if (!backendReady()) throw new HttpError(503, 'unavailable');
    if (req.method !== 'GET' && !isWebhook(action) && !sameOrigin(req)) throw new HttpError(403, 'forbidden');
    return await handleConnect(action, req, sessionEmail(req));
  } catch (err) {
    if (err instanceof HttpError) return json({ ok: false, reason: err.reason }, err.status);
    console.error('connect api failed', action, err);
    return json({ ok: false, reason: 'unavailable' }, 503);
  }
}

export { handle as GET, handle as POST };
