'use client';

// /directorio/editar: sign in with email + code, then claim, fill and publish a profile.
// ?next=/connect (or /connect?intro=<slug>) sends the person back to Connect after saving.
import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  CATEGORY_KEYS,
  CATEGORY_LABELS,
  MAX_CATEGORIES,
  MAX_SERVICES,
  PRIVACY_PATH,
  type CategoryKey,
  type OwnerProfile,
  type ProfileKind,
  profilePath,
  safeNext,
} from '@/lib/directory/config';
import { api, errorText, post } from './api';
import ProfileAvatar from './ProfileAvatar';
import SignIn from './SignIn';

interface Form {
  kind: ProfileKind;
  name: string;
  company: string;
  job_title: string;
  headline: string;
  description: string;
  services: string;
  categories: CategoryKey[];
  city: string;
  website: string;
  linkedin_url: string;
  whatsapp: string;
  published: boolean;
}

const EMPTY: Form = {
  kind: 'professional',
  name: '',
  company: '',
  job_title: '',
  headline: '',
  description: '',
  services: '',
  categories: [],
  city: '',
  website: '',
  linkedin_url: '',
  whatsapp: '',
  published: false,
};

const toForm = (p: OwnerProfile | null): Form =>
  p
    ? {
        kind: p.kind,
        name: p.name ?? '',
        company: p.company ?? '',
        job_title: p.job_title ?? '',
        headline: p.headline ?? '',
        description: p.description ?? '',
        services: (p.services ?? []).join('\n'),
        categories: p.categories ?? [],
        city: p.city ?? '',
        website: p.website ?? '',
        linkedin_url: p.linkedin_url ?? '',
        whatsapp: p.whatsapp ?? '',
        published: !!p.published,
      }
    : EMPTY;

const FIELD_ERRORS: Record<string, string> = {
  name: 'Escribe un nombre.',
  services: `Hasta ${MAX_SERVICES} servicios de máximo 60 caracteres cada uno.`,
  categories: `Elige hasta ${MAX_CATEGORIES} categorías.`,
  website: 'Revisa la URL de tu sitio web.',
  linkedin_url: 'Usa la URL de tu perfil o página de LinkedIn.',
  whatsapp: 'Escribe el número con código de país, solo números.',
};

/** Shrinks a photo to 800 px on its longest side before upload (JPEG, or PNG to keep transparency). */
async function shrink(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return file;
  const scale = Math.min(1, 800 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const type = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, 0.85));
  return blob && blob.size < file.size ? blob : file;
}

export default function ProfileEditor() {
  const params = useSearchParams();
  const next = safeNext(params.get('next'));
  const toConnect = !!next?.startsWith('/connect');

  const [state, setState] = useState<'loading' | 'signin' | 'form'>('loading');
  const [signInMsg, setSignInMsg] = useState('');
  const [email, setEmail] = useState('');
  const [profile, setProfile] = useState<OwnerProfile | null>(null);
  const [form, setForm] = useState<Form>(EMPTY);
  const [fieldErrors, setFieldErrors] = useState<string[]>([]);
  const [msg, setMsg] = useState('');
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoMsg, setPhotoMsg] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const show = useCallback((body: { email: string; profile: OwnerProfile | null }) => {
    setEmail(body.email);
    setProfile(body.profile);
    setForm(toForm(body.profile));
    setState('form');
  }, []);

  useEffect(() => {
    api('profile').then((res) => {
      if (res.body.ok) return show(res.body);
      if (res.status !== 401) setSignInMsg(errorText(res.body.reason));
      setState('signin');
    });
  }, [show]);

  function expired() {
    setSignInMsg(errorText('unauthorized'));
    setState('signin');
  }

  const set = <K extends keyof Form>(key: K, value: Form[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
  };

  function toggleCategory(key: CategoryKey, on: boolean) {
    setForm((f) => {
      const categories = on ? [...f.categories, key].slice(0, MAX_CATEGORIES) : f.categories.filter((c) => c !== key);
      return { ...f, categories };
    });
    setSaved(false);
  }

  async function save(ev: FormEvent) {
    ev.preventDefault();
    setBusy(true);
    setMsg('');
    setFieldErrors([]);
    const res = await post('profile', { ...form, services: form.services.split('\n') });
    setBusy(false);
    if (res.status === 401) return expired();
    if (!res.body.ok) {
      setFieldErrors(res.body.fields ?? []);
      return setMsg(errorText(res.body.reason));
    }
    setProfile(res.body.profile);
    setForm(toForm(res.body.profile));
    setSaved(true);
  }

  async function uploadPhoto(file: File) {
    setPhotoBusy(true);
    setPhotoMsg('');
    const data = new FormData();
    data.append('photo', await shrink(file), file.name);
    const res = await api('photo', { method: 'POST', body: data });
    setPhotoBusy(false);
    if (res.status === 401) return expired();
    if (!res.body.ok) return setPhotoMsg(errorText(res.body.reason));
    setProfile(res.body.profile);
  }

  async function removePhoto() {
    setPhotoBusy(true);
    const res = await api('photo', { method: 'DELETE' });
    setPhotoBusy(false);
    if (res.status === 401) return expired();
    if (!res.body.ok) return setPhotoMsg(errorText(res.body.reason));
    setProfile(res.body.profile);
  }

  async function logout() {
    await post('logout');
    setProfile(null);
    setForm(EMPTY);
    setSignInMsg('');
    setState('signin');
  }

  if (state === 'loading') {
    return (
      <div className="flex justify-center py-16 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" aria-label="Cargando" />
      </div>
    );
  }

  if (state === 'signin') {
    return (
      <SignIn
        hint="Usa el correo con el que te registraste a un evento de CAHUSA MX en Luma. Si no te registraste, también puedes crear un perfil nuevo con cualquier correo."
        message={signInMsg}
        onSignedIn={show}
      />
    );
  }

  const notice =
    profile === null
      ? 'No encontramos un registro con este correo. Llena tu perfil desde cero.'
      : profile.status === 'unclaimed'
        ? 'Encontramos tu registro. Revisa lo que precargamos, complétalo y publícalo cuando quieras.'
        : 'Este es tu perfil. Los cambios se guardan cuando presionas Guardar.';
  const err = (field: string) => (fieldErrors.includes(field) ? <p className="text-sm text-danger">{FIELD_ERRORS[field]}</p> : null);
  const isCompany = form.kind === 'company';

  return (
    <form onSubmit={save} className="space-y-8 rounded-2xl border bg-white p-6 shadow-sm md:p-10">
      {toConnect && !saved && (
        <p className="rounded-lg bg-primary-50 p-4 text-navy">
          Connect necesita tu perfil: con él armamos tu presentación en cada intro. Guárdalo y te llevamos de vuelta.
        </p>
      )}
      <p className="text-muted-foreground">
        {notice} <span className="text-sm">Entraste como {email}.</span>
      </p>

      <fieldset className="space-y-2">
        <legend className="mb-2 font-medium text-navy">Tipo de perfil</legend>
        <div className="flex gap-6">
          {(['professional', 'company'] as ProfileKind[]).map((k) => (
            <label key={k} className="flex items-center gap-2">
              <input type="radio" name="kind" value={k} checked={form.kind === k} onChange={() => set('kind', k)} />
              {k === 'company' ? 'Empresa' : 'Profesional'}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="p-name">Nombre</Label>
          <Input id="p-name" required maxLength={120} value={form.name} onChange={(e) => set('name', e.target.value)} />
          <p className="text-sm text-muted-foreground">
            {isCompany
              ? 'El nombre de la empresa como quieres que aparezca.'
              : 'Tu nombre y apellido como quieres que aparezcan. Connect los usa para presentarte.'}
          </p>
          {err('name')}
        </div>
        {!isCompany && (
          <div className="space-y-2">
            <Label htmlFor="p-company">Empresa</Label>
            <Input id="p-company" maxLength={120} value={form.company} onChange={(e) => set('company', e.target.value)} />
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="p-job">{isCompany ? 'Giro' : 'Cargo'}</Label>
          <Input id="p-job" maxLength={120} value={form.job_title} onChange={(e) => set('job_title', e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="p-city">Ciudad</Label>
          <Input id="p-city" maxLength={80} value={form.city} onChange={(e) => set('city', e.target.value)} />
          <p className="text-sm text-muted-foreground">Por ejemplo: Cancún, Tulum, Playa del Carmen, Miami.</p>
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="p-headline">Frase corta</Label>
          <Input id="p-headline" maxLength={160} value={form.headline} onChange={(e) => set('headline', e.target.value)} />
          <p className="text-sm text-muted-foreground">Una línea sobre lo que haces. Aparece en el listado. Máximo 160 caracteres.</p>
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="p-description">Descripción</Label>
          <Textarea id="p-description" rows={6} maxLength={2000} value={form.description} onChange={(e) => set('description', e.target.value)} />
          <p className="text-sm text-muted-foreground">A qué te dedicas, con quién trabajas, qué buscas. Máximo 2,000 caracteres.</p>
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="p-services">Servicios</Label>
          <Textarea id="p-services" rows={4} value={form.services} onChange={(e) => set('services', e.target.value)} />
          <p className="text-sm text-muted-foreground">
            Uno por línea, hasta {MAX_SERVICES}. Por ejemplo: Administración de rentas vacacionales, Limpieza de villas.
          </p>
          {err('services')}
        </div>
      </div>

      <fieldset>
        <legend className="mb-1 font-medium text-navy">Categorías</legend>
        <p className="mb-3 text-sm text-muted-foreground">Elige hasta {MAX_CATEGORIES}. Sirven para los filtros del directorio.</p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {CATEGORY_KEYS.map((key) => {
            const checked = form.categories.includes(key);
            return (
              <label key={key} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={!checked && form.categories.length >= MAX_CATEGORIES}
                  onChange={(e) => toggleCategory(key, e.target.checked)}
                />
                {CATEGORY_LABELS[key]}
              </label>
            );
          })}
        </div>
        {err('categories')}
      </fieldset>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="p-website">Sitio web</Label>
          <Input id="p-website" inputMode="url" maxLength={300} value={form.website} onChange={(e) => set('website', e.target.value)} />
          {err('website')}
        </div>
        <div className="space-y-2">
          <Label htmlFor="p-linkedin">LinkedIn</Label>
          <Input id="p-linkedin" inputMode="url" maxLength={300} value={form.linkedin_url} onChange={(e) => set('linkedin_url', e.target.value)} />
          {err('linkedin_url')}
        </div>
        <div className="space-y-2">
          <Label htmlFor="p-whatsapp">WhatsApp (opcional)</Label>
          <Input id="p-whatsapp" inputMode="tel" maxLength={40} value={form.whatsapp} onChange={(e) => set('whatsapp', e.target.value)} />
          {err('whatsapp')}
        </div>
        <p className="text-sm text-muted-foreground md:col-span-3">
          LinkedIn y WhatsApp no se muestran en tu perfil público: quien quiera contactarte pide una intro. Con un plan de pago de
          Connect puedes elegir mostrarlos.
        </p>
      </div>

      <div className="space-y-3">
        <p className="font-medium text-navy">Foto o logo</p>
        <div className="flex flex-wrap items-center gap-4">
          <ProfileAvatar name={form.name || email} photoUrl={profile?.photo_url ?? null} className="h-20 w-20" />
          {profile ? (
            <>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                id="p-photo"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadPhoto(file);
                  e.target.value = '';
                }}
              />
              <Button type="button" variant="outline" disabled={photoBusy} onClick={() => fileRef.current?.click()}>
                {photoBusy && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
                {profile.photo_url ? 'Cambiar imagen' : 'Subir imagen'}
              </Button>
              {profile.photo_url && (
                <Button type="button" variant="ghost" disabled={photoBusy} onClick={removePhoto}>
                  Quitar imagen
                </Button>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Guarda tu perfil una vez para poder subir una imagen.</p>
          )}
        </div>
        <p className="text-sm text-muted-foreground">JPG, PNG o WebP. La reducimos a 800 px antes de subirla.</p>
        {photoMsg && <p className="text-sm text-danger">{photoMsg}</p>}
      </div>

      <div className="flex items-start gap-3 rounded-lg border p-4">
        <Switch id="p-published" checked={form.published} onCheckedChange={(v) => set('published', v)} />
        <div>
          <Label htmlFor="p-published" className="text-base">
            Publicar en el directorio
          </Label>
          <p className="text-sm text-muted-foreground">
            Si lo activas, cualquiera puede ver tu perfil en cahusa.mx/directorio. Tu correo nunca se muestra. Puedes desactivarlo cuando
            quieras.
          </p>
        </div>
      </div>

      {msg && <p className="text-danger" role="alert">{msg}</p>}
      {saved && (
        <div className="rounded-lg bg-success-50 p-4 text-success-700" role="status">
          {profile?.published && profile.slug ? (
            <>
              Guardado. Tu perfil ya está en el directorio:{' '}
              <Link href={profilePath(profile.slug)} className="font-medium underline">
                Ver mi perfil público
              </Link>
            </>
          ) : (
            'Guardado. Tu perfil no está publicado: nadie más lo ve.'
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={busy} size="lg">
          {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
          {busy ? 'Guardando…' : 'Guardar'}
        </Button>
        {saved && next && (
          <Link href={next} className="btn-primary">
            {toConnect ? 'Continuar a Connect' : 'Continuar'}
          </Link>
        )}
      </div>

      <div className="flex items-center justify-between border-t pt-6 text-sm">
        <button type="button" onClick={logout} className="text-muted-foreground underline-offset-4 hover:underline">
          Salir
        </button>
        <Link href={PRIVACY_PATH} className="text-teal underline-offset-4 hover:underline">
          Cómo tratamos tus datos
        </Link>
      </div>
    </form>
  );
}
