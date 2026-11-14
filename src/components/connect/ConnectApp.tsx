'use client';

// /connect: sign-in (same as the directory) -> ICP -> anonymous matches -> intro dialog.
// Talks to /api/directorio/* for the session and /api/directorio/connect/* for the rest. The limits
// shown here are only hints: the API and the SQL functions enforce them.
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { api, errorText, post, type ApiResult } from '@/components/directory/api';
import SignIn from '@/components/directory/SignIn';
import { CONNECT_PATH, EDIT_PATH, PRIVACY_PATH, SIZE_LABELS, SLUG_RE } from '@/lib/directory/config';
import { PLAN_NAMES, PLANS, type PlanKey } from '@/lib/connect/plans';
import { cn } from '@/lib/utils';

// Anonymous until the intro goes out: id is an opaque token, label says what they do, never who.
interface Match {
  id: string;
  /** Only for Business and Business Plus members; Starter sees a blurred stand-in. */
  name: string | null;
  kind: 'company' | 'professional';
  label: string;
  city: string | null;
  size: string | null;
  featured: boolean;
  score: number;
  reason: string;
  introduced: boolean;
}

interface Usage {
  today: number;
  dailyLimit: number;
  freeUsed: number;
  freeLimit: number;
  icps: string[];
  icpLimit: number;
}

interface Status {
  email: string;
  profile: { id: string; name: string; plan: PlanKey; fullName: boolean; showContact: boolean } | null;
  usage?: Usage;
  billing: boolean;
  search?: { id: string; icp: string; icpUsed: boolean; matches: Match[]; at: string } | null;
}

interface Preview {
  subject: string;
  text: string;
  to: string;
  cc: string;
}

interface DirectTarget {
  name: string;
  job_title: string | null;
  company: string | null;
  city: string | null;
}

const PAGE_SIZE = 25;
const EDIT_FOR_CONNECT = `${EDIT_PATH}?next=${encodeURIComponent(CONNECT_PATH)}`;

/**
 * A stand-in for the match's name, shown blurred. It is filler, never the real name (that would be
 * readable in the page source); its shape comes from the token so each card looks different.
 */
function hiddenName(token: string) {
  const len = (i: number, min: number, span: number) => min + (parseInt(token.slice(i, i + 2), 16) % span);
  const word = (n: number) => 'X' + 'x'.repeat(n - 1);
  const last = parseInt(token[6], 16) % 3 === 0 ? `${word(len(8, 4, 5))} ${word(len(10, 4, 4))}` : word(len(8, 5, 6));
  return `${word(len(0, 3, 6))} ${last}`;
}

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many.replace('#', String(n)));

/**
 * A progress bar for the search. The real progress isn't known, so it runs fast to 80% in the first
 * 6 s, then creeps toward 95% and jumps to 100% when the answer arrives.
 */
function SearchProgress() {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    const start = performance.now();
    const estimate = (ms: number) => (ms < 6_000 ? 80 * (1 - (1 - ms / 6_000) ** 2) : 80 + 15 * (1 - Math.exp(-(ms - 6_000) / 15_000)));
    const timer = setInterval(() => setPct(Math.round(estimate(performance.now() - start))), 200);
    return () => clearInterval(timer);
  }, []);
  return (
    <div className="mt-4 flex items-center gap-3">
      <div
        className="h-2 flex-1 overflow-hidden rounded-full bg-primary-50"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        aria-label="Buscando matches"
      >
        <div className="h-full bg-teal transition-[width] duration-200" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-10 text-right text-sm tabular-nums text-muted-foreground">{pct}%</span>
    </div>
  );
}

export default function ConnectApp() {
  const params = useSearchParams();
  const router = useRouter();

  const [view, setView] = useState<'loading' | 'signin' | 'noprofile' | 'app'>('loading');
  const [signInMsg, setSignInMsg] = useState('');
  const [state, setState] = useState<Status | null>(null);
  const [flash, setFlash] = useState('');

  // search
  const [icp, setIcp] = useState('');
  const [icpMsg, setIcpMsg] = useState('');
  const [searching, setSearching] = useState(false);
  const [lastSearchAt, setLastSearchAt] = useState<string | null>(null);
  const [current, setCurrent] = useState<{ id: string; icpUsed: boolean } | null>(null);
  const [matches, setMatches] = useState<Match[] | null>(null);
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const listTop = useRef<HTMLDivElement>(null);
  const icpRef = useRef<HTMLTextAreaElement>(null);

  // dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [direct, setDirect] = useState<{ slug: string; target: DirectTarget; introduced: boolean } | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [previewMsg, setPreviewMsg] = useState('');
  const [dialogMsg, setDialogMsg] = useState('');
  const [sending, setSending] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [plansForced, setPlansForced] = useState(false);
  const [subscribing, setSubscribing] = useState<PlanKey | null>(null);

  const [contactBusy, setContactBusy] = useState(false);
  const [portalBusy, setPortalBusy] = useState(false);

  const rawIntro = params.get('intro');
  const introSlug = useRef<string | null>(rawIntro && SLUG_RE.test(rawIntro) ? rawIntro : null);

  const plan = state?.profile?.plan ?? 'starter';
  const isFree = plan === 'starter';
  const usage = state?.usage;
  const freeLeft = usage ? Math.max(0, usage.freeLimit - usage.freeUsed) : 0;
  const todayLeft = usage ? Math.max(0, usage.dailyLimit - usage.today) : 0;
  const icpLimit = usage?.icpLimit ?? 1;
  const icpsUsed = useMemo(() => usage?.icps ?? [], [usage]);
  const icpsLeft = Math.max(0, icpLimit - icpsUsed.length);
  const icpsFull = icpsLeft === 0;
  const newIcp = !!current && !current.icpUsed;

  const list = useMemo(() => matches ?? [], [matches]);
  const selectable = useMemo(() => list.filter((m) => !m.introduced), [list]);
  const selectedIds = useMemo(() => selectable.filter((m) => selected.has(m.id)).map((m) => m.id), [selectable, selected]);
  const pageCount = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  const pageItems = list.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  /** On 401 anywhere: back to the email step. Returns true when it handled the response. */
  const expired = useCallback((res: ApiResult) => {
    if (res.status !== 401) return false;
    setState(null);
    setDialogOpen(false);
    setSignInMsg(errorText('unauthorized'));
    setView('signin');
    return true;
  }, []);

  const showMatches = useCallback((next: Match[]) => {
    setMatches(next);
    setPage(0);
    setSelected(new Set());
  }, []);

  // ---------- direct intro (from a directory profile: /connect?intro=<slug>) ----------

  const forgetIntroParam = useCallback(() => {
    if (!introSlug.current) return;
    introSlug.current = null;
    router.replace(CONNECT_PATH, { scroll: false });
  }, [router]);

  const openDirect = useCallback(
    async (slug: string) => {
      const res = await post('connect/direct', { slug });
      if (expired(res)) return;
      if (!res.body.ok) {
        forgetIntroParam();
        return setFlash(errorText(res.body.reason));
      }
      setDirect({ slug, target: res.body.target, introduced: res.body.introduced });
      setPreview({ subject: res.body.subject, text: res.body.text, to: res.body.to, cc: res.body.cc });
      setPreviewMsg('');
      setDialogMsg('');
      setBlocked(false);
      setPlansForced(false);
      setDialogOpen(true);
    },
    [expired, forgetIntroParam],
  );

  // ---------- status ----------

  const load = useCallback(async () => {
    const res = await api('connect/status');
    if (res.status === 401) {
      setView('signin');
      return;
    }
    if (!res.body.ok) {
      setSignInMsg(errorText(res.body.reason));
      setView('signin');
      return;
    }
    const status = res.body as Status;
    setState(status);
    if (!status.profile) return setView('noprofile');
    if (status.search) {
      setCurrent({ id: status.search.id, icpUsed: status.search.icpUsed });
      setIcp(status.search.icp);
      setLastSearchAt(status.search.at);
      showMatches(status.search.matches);
    }
    setView('app');
    if (introSlug.current) openDirect(introSlug.current);
  }, [openDirect, showMatches]);

  useEffect(() => {
    load();
    // Back from Stripe Checkout: say what happened and clean the URL.
    const checkout = params.get('checkout');
    if (checkout) {
      setFlash(
        checkout === 'success'
          ? 'Gracias por suscribirte. Tu plan se activa en unos segundos.'
          : 'No se completó el pago. Tu plan sigue igual.',
      );
      router.replace(CONNECT_PATH, { scroll: false });
      // The Stripe webhook usually lands a few seconds after the redirect.
      if (checkout === 'success') setTimeout(load, 6000);
    }
    // Runs once on mount; the query string is read then.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // At the limit a new description can't send intros, so the box only takes the used ICPs.
  useEffect(() => {
    if (view === 'app' && icpsFull && icpsUsed.length && !icpsUsed.includes(icp.trim())) setIcp(icpsUsed[icpsUsed.length - 1]);
  }, [view, icpsFull, icpsUsed, icp]);

  // ---------- search ----------

  async function search(ev: FormEvent) {
    ev.preventDefault();
    const text = icp.trim();
    if (text.length < 20) return setIcpMsg(errorText('icp_short'));
    setIcpMsg('');
    setFlash('');
    setSearching(true);
    const res = await post('connect/search', { icp: text });
    setSearching(false);
    if (expired(res)) return;
    if (!res.body.ok) return setIcpMsg(errorText(res.body.reason));
    setState((s) => (s ? { ...s, usage: res.body.usage } : s));
    setCurrent(res.body.search);
    setLastSearchAt(null);
    showMatches(res.body.matches);
  }

  // ---------- selection ----------

  function toggle(id: string, on: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function toggleAll(on: boolean) {
    setSelected(on ? new Set(selectable.map((m) => m.id)) : new Set());
  }

  function goToPage(next: number) {
    setPage(Math.max(0, Math.min(next, pageCount - 1)));
    listTop.current?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }

  // ---------- intro dialog ----------

  function limitsNote(n: number) {
    if (!direct && newIcp && icpsLeft === 0) return 'Esta búsqueda usa un ICP nuevo y ya usaste todos los de tu plan. Cambia de plan para enviar.';
    if (isFree && n > freeLeft) return `Seleccionaste ${n} y te quedan ${freeLeft} gratis. Quita algunas o suscríbete.`;
    if (n > todayLeft) return `Seleccionaste ${n} y hoy puedes pedir ${todayLeft} más. Quita algunas o vuelve mañana.`;
    return '';
  }

  async function openSearchDialog() {
    if (!selectedIds.length || !state?.profile) return;
    setDirect(null);
    setPreview(null);
    setPreviewMsg('');
    setDialogMsg('');
    setBlocked(false);
    setPlansForced(false);
    setDialogOpen(true);
    const res = await post('connect/preview', { match_id: selectedIds[0] });
    if (expired(res)) return;
    if (!res.body.ok) return setPreviewMsg(errorText(res.body.reason));
    setPreview({ subject: res.body.subject, text: res.body.text, to: res.body.to, cc: res.body.cc });
  }

  function closeDialog(open: boolean) {
    if (open) return;
    setDialogOpen(false);
    if (direct) forgetIntroParam();
  }

  async function send() {
    setSending(true);
    setDialogMsg('');
    if (direct) {
      const res = await post('connect/direct-intro', { slug: direct.slug });
      setSending(false);
      if (expired(res)) return;
      if (!res.body.ok) {
        setDialogMsg(errorText(res.body.reason));
        setBlocked(['daily_limit', 'free_limit', 'incomplete_name', 'already_introduced', 'self_intro', 'not_found'].includes(res.body.reason));
        if (res.body.reason === 'free_limit') setPlansForced(true);
        return;
      }
      setState((s) => (s ? { ...s, usage: res.body.usage } : s));
      closeDialog(false);
      return setFlash(`Listo: le enviamos la intro a ${direct.target.name}, contigo en copia.`);
    }

    const ids = selectedIds;
    const res = await post('connect/intros', { search_id: current?.id, match_ids: ids });
    setSending(false);
    if (expired(res)) return;
    if (!res.body.ok) {
      setDialogMsg(errorText(res.body.reason));
      setBlocked(['daily_limit', 'free_limit', 'icp_limit', 'search_expired', 'incomplete_name'].includes(res.body.reason));
      if (res.body.reason === 'icp_limit' || res.body.reason === 'free_limit') setPlansForced(true);
      return;
    }
    const sent: string[] = res.body.sent;
    const failed: string[] = res.body.failed;
    setState((s) => (s ? { ...s, usage: res.body.usage } : s));
    setMatches((ms) => (ms ?? []).map((m) => (sent.includes(m.id) ? { ...m, introduced: true } : m)));
    setSelected((prev) => new Set([...prev].filter((id) => !sent.includes(id))));
    if (current && sent.length) setCurrent({ ...current, icpUsed: true });
    setDialogOpen(false);
    setFlash(
      failed.length
        ? `Enviamos ${sent.length}. ${failed.length} no se pudieron enviar; no cuentan y puedes reintentar.`
        : plural(sent.length, 'Listo: enviamos 1 intro. Revisa tu correo.', 'Listo: enviamos # intros. Revisa tu correo.'),
    );
  }

  // "Find similar profiles": the ICP box gets a description built from that profile; the member
  // reviews it and searches (nothing runs on its own, so no search or ICP is spent by surprise).
  function similar() {
    if (!direct) return;
    const t = direct.target;
    closeDialog(false);
    if (icpsFull) return setFlash(icpsFullNote);
    setIcp(`Perfiles similares a: ${t.job_title || t.name}${t.company ? `, en una empresa como ${t.company}` : ''}${t.city ? `, en ${t.city}` : ''}.`);
    icpRef.current?.focus();
    icpRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }

  async function subscribe(key: PlanKey) {
    setSubscribing(key);
    const res = await post('connect/checkout', { plan: key });
    if (expired(res)) return;
    if (res.body.ok && res.body.url) {
      window.location.href = res.body.url;
      return;
    }
    setSubscribing(null);
    setDialogMsg(errorText(res.body.reason));
  }

  async function openPortal() {
    setPortalBusy(true);
    const res = await post('connect/portal');
    if (expired(res)) return;
    if (res.body.ok && res.body.url) {
      window.location.href = res.body.url;
      return;
    }
    setPortalBusy(false);
    setFlash(errorText(res.body.reason));
  }

  async function toggleContact(show: boolean) {
    setContactBusy(true);
    const res = await post('connect/contact', { show });
    setContactBusy(false);
    if (expired(res)) return;
    if (!res.body.ok) return setFlash(errorText(res.body.reason));
    setState((s) => (s?.profile ? { ...s, profile: { ...s.profile, showContact: res.body.showContact } } : s));
  }

  // ---------- views ----------

  if (view === 'loading') {
    return (
      <div className="flex justify-center py-16 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" aria-label="Cargando" />
      </div>
    );
  }

  if (view === 'signin') {
    return (
      <SignIn
        hint="Connect es para quienes tienen perfil en el directorio. Usa el mismo correo de tu perfil."
        message={signInMsg}
        onSignedIn={() => {
          setSignInMsg('');
          setView('loading');
          load();
        }}
      />
    );
  }

  if (view === 'noprofile') {
    // From a directory profile's "Pedir intro": after creating the profile, come back to it.
    const back = introSlug.current ? `${CONNECT_PATH}?intro=${introSlug.current}` : CONNECT_PATH;
    return (
      <div className="mx-auto max-w-md space-y-4 rounded-2xl border bg-white p-6 text-center shadow-sm md:p-8">
        <h2 className="font-heading text-2xl text-navy">Primero crea tu perfil</h2>
        <p className="text-muted-foreground">
          Connect es para quienes tienen perfil en el directorio: con él armamos tu presentación. Te toma dos minutos.
        </p>
        <Link href={`${EDIT_PATH}?next=${encodeURIComponent(back)}`} className="btn-primary inline-block">
          Crear mi perfil
        </Link>
      </div>
    );
  }

  const profile = state!.profile!;
  const icpsFullNote =
    icpLimit === 1
      ? 'Ya usaste el ICP de tu plan. Elige uno para buscar o cambia de plan para describir otro.'
      : `Ya usaste los ${icpLimit} ICP de tu plan. Elige uno para buscar o cambia de plan para describir otro.`;
  const icpsHint = `Tu plan incluye ${icpLimit === 1 ? '1 ICP' : `${icpLimit} ICP`}. Buscar es libre: un ICP se usa cuando envías la primera intro de esa búsqueda.`;

  // What the dialog says and allows.
  const n = direct ? 1 : selectedIds.length;
  const freeNote = isFree
    ? freeLeft > 0
      ? `El plan Starter incluye ${usage?.freeLimit ?? 3} intros gratis por organización. A la tuya le quedan ${freeLeft}. O suscríbete para pedir intros ilimitadas.`
      : `Tu organización ya usó sus ${usage?.freeLimit ?? 3} intros gratis. Suscríbete para pedir intros ilimitadas.`
    : '';
  let lead = direct
    ? `Vas a pedir una intro a ${direct.target.name}.${freeNote ? ` ${freeNote}` : ''}`
    : isFree
      ? freeNote
      : plural(n, 'Vas a pedir 1 intro.', 'Vas a pedir # intros.');
  if (!direct && newIcp && icpsLeft > 0) {
    const left = icpsLeft - 1;
    lead += ` ${left === 0 ? 'Esta búsqueda usa un ICP nuevo: es el último de tu plan.' : `Esta búsqueda usa un ICP nuevo: al enviar, te ${left === 1 ? 'quedará 1' : `quedarán ${left}`} de tu plan.`}`;
  }
  const incomplete = !profile.fullName;
  const over = direct?.introduced ? errorText('already_introduced') : incomplete ? '' : limitsNote(n);
  const showPlans = plansForced || isFree || (!direct && newIcp && icpsLeft === 0);

  return (
    <div className="space-y-6">
      {/* Usage line, profile link and paid-plan options */}
      <div className="flex flex-col gap-3 rounded-xl border bg-white p-4 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-navy">
          {isFree
            ? `Plan Starter: a tu organización le quedan ${freeLeft} de ${usage?.freeLimit ?? 3} intros gratis.`
            : `Plan ${PLAN_NAMES[plan]}: intros ilimitadas.`}{' '}
          {`Hoy puedes pedir ${todayLeft} más (máximo ${usage?.dailyLimit ?? 10} al día).`}
        </p>
        <div className="flex flex-wrap items-center gap-3">
          {state!.billing && !isFree && (
            <Button type="button" variant="outline" size="sm" disabled={portalBusy} onClick={openPortal}>
              Administrar suscripción
            </Button>
          )}
          <Link
            href={EDIT_FOR_CONNECT}
            title={`Entraste como ${state!.email}`}
            className="inline-flex items-center gap-1 text-sm font-medium text-teal hover:underline"
          >
            <UserRound className="h-4 w-4" aria-hidden="true" />
            Perfil
          </Link>
        </div>
      </div>

      {!isFree && (
        <div className="flex items-center gap-3 rounded-xl border bg-white p-4">
          <Switch id="show-contact" checked={profile.showContact} disabled={contactBusy} onCheckedChange={toggleContact} />
          <Label htmlFor="show-contact">Mostrar mi LinkedIn y WhatsApp en el directorio</Label>
        </div>
      )}

      {flash && (
        <p className="rounded-lg bg-primary-50 p-4 text-navy" role="status">
          {flash}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        {/* ICP */}
        <form onSubmit={search} className="h-fit space-y-4 rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="font-heading text-2xl text-navy">Tu cliente ideal</h2>
          <p className="text-sm text-muted-foreground">
            Industria, tipo de empresa, cargos, tamaño, qué problema tienen. Mientras más concreto, mejores matches.
          </p>
          <Textarea
            ref={icpRef}
            aria-label="Tu cliente ideal"
            rows={7}
            maxLength={2000}
            readOnly={icpsFull}
            value={icp}
            onChange={(e) => setIcp(e.target.value)}
            placeholder="Ej.: Administradores de rentas vacacionales con 10 a 100 propiedades en Tulum y Playa del Carmen que quieran automatizar limpieza, check-in y atención a huéspedes."
          />
          {icpMsg && <p className="text-sm text-danger" role="alert">{icpMsg}</p>}
          <Button type="submit" disabled={searching} className="w-full">
            {searching && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
            {searching ? 'Buscando…' : 'Buscar matches'}
          </Button>
          {lastSearchAt && (
            <p className="text-xs text-muted-foreground">
              Última búsqueda: {new Date(lastSearchAt).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })}
            </p>
          )}
          <div className="border-t pt-4">
            <h3 className="font-medium text-navy">{`Tus ICP (${icpsUsed.length} de ${icpLimit})`}</h3>
            {icpsUsed.length > 0 && (
              <ul className="mt-2 space-y-2">
                {icpsUsed.map((used) => (
                  <li key={used}>
                    <button
                      type="button"
                      className="w-full rounded-lg border px-3 py-2 text-left text-sm text-navy hover:border-teal"
                      onClick={() => {
                        setIcp(used);
                        icpRef.current?.focus();
                      }}
                    >
                      {used}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-2 text-xs text-muted-foreground">{icpsFull ? icpsFullNote : icpsHint}</p>
          </div>
        </form>

        {/* Matches */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            openSearchDialog();
          }}
          className="relative rounded-2xl border bg-white p-6 shadow-sm"
          aria-busy={searching}
        >
          <div ref={listTop} className="scroll-mt-24" />
          <div className="mb-2 flex items-baseline justify-between gap-4">
            <h2 className="font-heading text-2xl text-navy">Matches {matches ? `(${list.length})` : ''}</h2>
          </div>
          <p className="mb-4 text-sm text-muted-foreground">
            {isFree ? 'Los nombres y empresas se revelan en el correo de la intro.' : 'Las empresas se revelan en el correo de la intro.'}
          </p>

          {searching ? (
            <div className="py-8 text-muted-foreground">
              <p className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Buscando en toda la comunidad… tarda unos 30 segundos.
              </p>
              <SearchProgress />
            </div>
          ) : !matches ? (
            <p className="py-8 text-muted-foreground">Escribe tu ICP y presiona Buscar matches.</p>
          ) : list.length === 0 ? (
            <p className="py-8 text-muted-foreground">No encontramos a nadie que encaje. Prueba con una descripción más amplia.</p>
          ) : (
            <>
              {selectable.length > 0 && (
                <label className="mb-3 flex items-center gap-2 text-sm text-navy">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === selectable.length}
                    ref={(el) => {
                      if (el) el.indeterminate = selectedIds.length > 0 && selectedIds.length < selectable.length;
                    }}
                    onChange={(e) => toggleAll(e.target.checked)}
                  />
                  Seleccionar todos
                </label>
              )}
              <ul className="space-y-3">
                {pageItems.map((m) => (
                  <li key={m.id} className={cn('rounded-xl border p-4', m.introduced && 'bg-muted/40 opacity-70')}>
                    <label className="flex cursor-pointer gap-3">
                      <input
                        type="checkbox"
                        className="mt-1"
                        disabled={m.introduced}
                        checked={!m.introduced && selected.has(m.id)}
                        onChange={(e) => toggle(m.id, e.target.checked)}
                      />
                      <span className="min-w-0 space-y-1">
                        {m.name ? (
                          <span className="block font-heading font-semibold text-navy">{m.name}</span>
                        ) : (
                          <span aria-hidden="true" className="block select-none font-heading font-semibold text-navy blur-[5px]">
                            {hiddenName(m.id)}
                          </span>
                        )}
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="text-navy">{m.label}</span>
                          {m.featured && (
                            <span className="rounded-full bg-gold-light/30 px-2 py-0.5 text-xs font-medium text-gold-dark">Destacado</span>
                          )}
                          {m.introduced && <span className="rounded-full bg-primary-50 px-2 py-0.5 text-xs text-navy">Ya los presentamos</span>}
                        </span>
                        {(m.size || m.city) && (
                          <span className="block text-xs text-muted-foreground">
                            {[m.size ? (SIZE_LABELS[m.size] ?? '') : '', m.city ?? ''].filter(Boolean).join(' · ')}
                          </span>
                        )}
                        {m.reason && <span className="block text-sm text-muted-foreground">{m.reason}</span>}
                      </span>
                    </label>
                    {/* No link to the profile: the way to reach a match is the intro. */}
                  </li>
                ))}
              </ul>
              {pageCount > 1 && (
                <nav aria-label="Páginas de matches" className="mt-4 flex items-center justify-between text-sm">
                  <Button type="button" variant="ghost" size="sm" disabled={page === 0} onClick={() => goToPage(page - 1)}>
                    ← Anterior
                  </Button>
                  <span className="text-muted-foreground">{`Página ${page + 1} de ${pageCount}`}</span>
                  <Button type="button" variant="ghost" size="sm" disabled={page >= pageCount - 1} onClick={() => goToPage(page + 1)}>
                    Siguiente →
                  </Button>
                </nav>
              )}
              {/* Pinned to the bottom of the screen while the list scrolls. */}
              <div className="sticky bottom-0 -mx-6 -mb-6 mt-4 flex items-center justify-between gap-4 rounded-b-2xl border-t bg-white/95 px-6 py-4 backdrop-blur">
                <span className="text-sm text-navy">
                  {selectedIds.length ? plural(selectedIds.length, '1 seleccionado', '# seleccionados') : ''}
                </span>
                <Button type="submit" disabled={selectedIds.length === 0}>
                  Pedir intro
                </Button>
              </div>
            </>
          )}
        </form>
      </div>

      <p className="text-center text-sm">
        <Link href={PRIVACY_PATH} className="text-teal underline-offset-4 hover:underline">
          Cómo tratamos tus datos
        </Link>
      </p>

      <Dialog open={dialogOpen} onOpenChange={closeDialog}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Pedir intro</DialogTitle>
            <DialogDescription>{lead}</DialogDescription>
          </DialogHeader>

          {incomplete && !direct?.introduced ? (
            <p className="text-sm text-danger">
              {errorText('incomplete_name')}{' '}
              <Link href={EDIT_FOR_CONNECT} className="font-medium underline">
                Completar mi perfil
              </Link>
            </p>
          ) : (
            (over || dialogMsg) && <p className="text-sm text-danger" role="alert">{dialogMsg || over}</p>
          )}

          {direct && (
            <button type="button" className="w-fit text-sm text-teal underline-offset-4 hover:underline" onClick={similar}>
              Mejor buscar perfiles similares
            </button>
          )}

          {showPlans && (
            <div className="grid gap-3 sm:grid-cols-3">
              {PLANS.map((p) => (
                <div key={p.key} className={cn('rounded-xl border p-4', p.key === plan && 'border-teal bg-primary-50/50')}>
                  <p className="font-heading font-semibold text-navy">{p.name}</p>
                  <p className="text-sm text-navy">
                    {p.price}
                    {p.key !== 'starter' && <span className="text-muted-foreground"> / mes</span>}
                  </p>
                  <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                    {p.perks.map((perk) => (
                      <li key={perk}>{perk}</li>
                    ))}
                  </ul>
                  {p.key === plan ? (
                    <p className="mt-3 text-xs font-medium text-teal">Tu plan</p>
                  ) : (
                    p.key !== 'starter' && (
                      <Button type="button" size="sm" className="mt-3 w-full" disabled={!!subscribing} onClick={() => subscribe(p.key)}>
                        {subscribing === p.key ? 'Abriendo el pago…' : 'Suscribirme'}
                      </Button>
                    )
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="rounded-xl border bg-muted/30 p-4">
            <p className="mb-2 text-sm font-medium text-navy">Así sale el correo</p>
            <p className="mb-3 text-xs text-muted-foreground">
              {direct
                ? 'Lo envía Esteban Gorupicz desde goru@cahusa.mx, con copia para ti. El texto es fijo.'
                : 'Lo envía Esteban Gorupicz desde goru@cahusa.mx, con copia para ti. El texto es fijo y se adapta a cada persona: el nombre y la empresa aparecen cuando se envía.'}
            </p>
            {preview ? (
              <div className="space-y-1 text-sm">
                <p className="text-muted-foreground">Para: {preview.to}</p>
                <p className="text-muted-foreground">Copia: {preview.cc}</p>
                <p className="font-medium text-navy">{preview.subject}</p>
                <pre className="mt-2 whitespace-pre-wrap font-sans text-navy">{preview.text}</pre>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{previewMsg || '…'}</p>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => closeDialog(false)}>
              Cancelar
            </Button>
            <Button type="button" onClick={send} disabled={sending || blocked || !!over || incomplete || n === 0}>
              {sending && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
              {sending ? 'Enviando…' : plural(n, 'Enviar 1 intro', 'Enviar # intros')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
