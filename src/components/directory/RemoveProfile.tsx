'use client';

// "Quitar mi perfil": the signed-in person takes their profile out of the directory and Connect.
// Shown by the editor after sign-in (from a public profile's link, or from the editor itself).
import { useState } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CONNECT_PATH, DIRECTORY_PATH, type OwnerProfile } from '@/lib/directory/config';
import { errorText, post } from './api';

const CONTACT = 'goru@cahusa.mx';

interface Props {
  email: string;
  profile: OwnerProfile | null;
  onRemoved: (profile: OwnerProfile) => void;
  onExpired: () => void;
  /** Back to the editor's form. */
  onCancel: () => void;
  onLogout: () => void;
}

const card = 'space-y-6 rounded-2xl border bg-white p-6 shadow-sm md:p-10';
const linkButton = 'text-teal underline-offset-4 hover:underline';

export default function RemoveProfile({ email, profile, onRemoved, onExpired, onCancel, onLogout }: Props) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [done, setDone] = useState(false);

  async function remove() {
    setBusy(true);
    setMsg('');
    const res = await post('remove');
    setBusy(false);
    if (res.status === 401) return onExpired();
    if (!res.body.ok) return setMsg(errorText(res.body.reason));
    onRemoved(res.body.profile);
    setDone(true);
  }

  if (!profile) {
    return (
      <div className={card}>
        <h2 className="font-heading text-2xl text-navy">No encontramos un perfil con este correo</h2>
        <p className="text-navy/90">
          Entraste como {email}. Si tu perfil aparece en el directorio, es con otro correo: sal y entra con ese. Si no sabes cuál es,
          escríbenos a{' '}
          <a href={`mailto:${CONTACT}`} className="text-teal underline">
            {CONTACT}
          </a>{' '}
          con el enlace de tu perfil y lo quitamos nosotros.
        </p>
        <div className="flex flex-wrap gap-4 text-sm">
          <button type="button" onClick={onLogout} className={linkButton}>
            Entrar con otro correo
          </button>
          <Link href={DIRECTORY_PATH} className={linkButton}>
            Volver al directorio
          </Link>
        </div>
      </div>
    );
  }

  const alreadyRemoved = !profile.published && !!profile.connect_opt_out;
  if (done || alreadyRemoved) {
    return (
      <div className={card} role="status">
        <h2 className="font-heading text-2xl text-navy">{done ? 'Listo, quitamos tu perfil' : 'Tu perfil ya no está en el directorio'}</h2>
        <p className="text-navy/90">
          Ya no aparece en cahusa.mx/directorio y Connect no te sugiere ni te presenta. La copia del directorio de Cancún Tech Day
          desaparece en unos minutos, salvo que hayas reclamado tu perfil allá: en ese caso quítalo también desde cancuntech.day.
        </p>
        <p className="text-sm text-muted-foreground">
          Si cambias de opinión, vuelve a tu perfil, activa «Publicar en el directorio» y guarda. Para borrar también tus datos,
          escríbenos a{' '}
          <a href={`mailto:${CONTACT}`} className="text-teal underline">
            {CONTACT}
          </a>
          .
        </p>
        <div className="flex flex-wrap gap-4 text-sm">
          <button type="button" onClick={onCancel} className={linkButton}>
            Ver mi perfil
          </button>
          <button type="button" onClick={onLogout} className="text-muted-foreground underline-offset-4 hover:underline">
            Salir
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={card}>
      <div>
        <h2 className="font-heading text-2xl text-navy">¿Quitar tu perfil del directorio?</h2>
        <p className="mt-2 text-muted-foreground">
          {profile.name} · entraste como {email}.
        </p>
      </div>
      <ul className="list-disc space-y-2 pl-5 text-navy/90">
        <li>Tu perfil deja de aparecer en cahusa.mx/directorio y su enlace deja de funcionar.</li>
        <li>Connect ya no te sugiere a otros miembros ni te presenta con nadie.</li>
        <li>Borramos tu foto.</li>
        {profile.plan && profile.plan !== 'starter' && (
          <li className="font-medium">
            Esto no cancela tu suscripción de Connect. Cancélala en{' '}
            <Link href={CONNECT_PATH} className="text-teal underline">
              Connect
            </Link>{' '}
            → «Administrar suscripción».
          </li>
        )}
        <li>
          En unos minutos también quitamos la copia del directorio de Cancún Tech Day (cancuntech.day). Si reclamaste tu perfil allá,
          quítalo también desde cancuntech.day.
        </li>
        <li>
          Guardamos el resto sin publicar para que una importación futura no lo vuelva a publicar. Si cambias de opinión, entra aquí y
          publícalo de nuevo. Para borrar también tus datos, escríbenos a{' '}
          <a href={`mailto:${CONTACT}`} className="text-teal underline">
            {CONTACT}
          </a>
          .
        </li>
      </ul>
      {msg && (
        <p className="text-danger" role="alert">
          {msg}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-4">
        <Button type="button" variant="destructive" size="lg" disabled={busy} onClick={remove}>
          {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
          {busy ? 'Quitando…' : 'Sí, quitar mi perfil'}
        </Button>
        <button type="button" onClick={onCancel} className={linkButton}>
          Mejor editar mi perfil
        </button>
      </div>
    </div>
  );
}
