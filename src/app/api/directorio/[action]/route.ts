// /api/directorio/{request-code,verify-code,logout,profile,photo}: sign-in and the profile editor.
import { HttpError, backendReady, json, sameOrigin, sessionEmail } from '@/lib/server/core';
import { handleDirectory } from '@/lib/server/directory';

export const dynamic = 'force-dynamic';

async function handle(req: Request, { params }: { params: Promise<{ action: string }> }) {
  const { action } = await params;
  try {
    if (!backendReady()) throw new HttpError(503, 'unavailable');
    if (req.method !== 'GET' && !sameOrigin(req)) throw new HttpError(403, 'forbidden');
    return await handleDirectory(action, req, sessionEmail(req));
  } catch (err) {
    if (err instanceof HttpError) return json({ ok: false, reason: err.reason }, err.status);
    console.error('directory api failed', action, err);
    return json({ ok: false, reason: 'unavailable' }, 503);
  }
}

export { handle as GET, handle as POST, handle as DELETE };
