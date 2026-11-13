'use client';

// Email + 6-digit code, shared by the profile editor and Connect. One sign-in covers both.
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EMAIL_RE } from '@/lib/directory/config';
import { errorText, post } from './api';

interface Props {
  hint: string;
  /** A message to show on the email step (e.g. "your session expired"). */
  message?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSignedIn: (body: any) => void;
}

export default function SignIn({ hint, message = '', onSignedIn }: Props) {
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState(message);
  const [busy, setBusy] = useState(false);
  const [resendLocked, setResendLocked] = useState(false);
  const codeRef = useRef<HTMLInputElement>(null);

  useEffect(() => setMsg(message), [message]);
  useEffect(() => {
    if (step === 'code') codeRef.current?.focus();
  }, [step]);

  async function requestCode(target: string) {
    const res = await post('request-code', { email: target });
    if (!res.body.ok) {
      setMsg(errorText(res.body.reason));
      return false;
    }
    return true;
  }

  async function submitEmail(ev: FormEvent) {
    ev.preventDefault();
    const value = email.trim().toLowerCase();
    if (!EMAIL_RE.test(value)) return setMsg(errorText('email_invalid'));
    setBusy(true);
    setMsg('');
    const ok = await requestCode(value);
    setBusy(false);
    if (!ok) return;
    setEmail(value);
    setCode('');
    setStep('code');
  }

  async function submitCode(ev: FormEvent) {
    ev.preventDefault();
    const digits = code.replace(/\D/g, '');
    if (digits.length !== 6) return setMsg(errorText('code_invalid'));
    setBusy(true);
    setMsg('');
    const res = await post('verify-code', { email, code: digits });
    setBusy(false);
    if (!res.body.ok) return setMsg(errorText(res.body.reason));
    onSignedIn(res.body);
  }

  async function resend() {
    setResendLocked(true);
    setMsg('');
    await requestCode(email);
    setTimeout(() => setResendLocked(false), 60_000);
  }

  if (step === 'email') {
    return (
      <form onSubmit={submitEmail} className="mx-auto max-w-md space-y-4 rounded-2xl border bg-white p-6 shadow-sm md:p-8">
        <h2 className="font-heading text-2xl text-navy">Entra con tu correo</h2>
        <p className="text-muted-foreground">{hint}</p>
        <div className="space-y-2">
          <Label htmlFor="signin-email">Correo</Label>
          <Input
            id="signin-email"
            type="email"
            autoComplete="email"
            required
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        {msg && <p className="text-sm text-danger" role="alert">{msg}</p>}
        <Button type="submit" disabled={busy} className="w-full">
          {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
          Enviarme el código
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={submitCode} className="mx-auto max-w-md space-y-4 rounded-2xl border bg-white p-6 shadow-sm md:p-8">
      <h2 className="font-heading text-2xl text-navy">Revisa tu correo</h2>
      <p className="text-muted-foreground">Te mandamos un código de 6 dígitos a {email}. Vence en 10 minutos.</p>
      <div className="space-y-2">
        <Label htmlFor="signin-code">Código</Label>
        <Input
          id="signin-code"
          ref={codeRef}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={7}
          required
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="text-center text-2xl tracking-[0.4em]"
        />
      </div>
      {msg && <p className="text-sm text-danger" role="alert">{msg}</p>}
      <Button type="submit" disabled={busy} className="w-full">
        {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
        Entrar
      </Button>
      <div className="flex justify-between text-sm">
        <button type="button" className="text-teal underline-offset-4 hover:underline disabled:opacity-50" onClick={resend} disabled={resendLocked}>
          Reenviar código
        </button>
        <button
          type="button"
          className="text-muted-foreground underline-offset-4 hover:underline"
          onClick={() => {
            setStep('email');
            setMsg('');
          }}
        >
          Usar otro correo
        </button>
      </div>
    </form>
  );
}
