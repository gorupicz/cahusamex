'use client';

import { useEffect, useState } from 'react';
import { ArrowRight, BadgeCheck, Loader2, Minus, Plus, Users } from 'lucide-react';
import {
  anahuacProgram,
  formatMXN,
  groupOffer,
  formatDay,
  installmentCents,
  installmentDates,
  listEs,
  todayInCancun,
  type GroupPlanId,
} from '@/data/anahuac';

/** Pesos with centavos only when there are any (8325 / 2 = 4,162.50). */
const money = (cents: number) =>
  `$${(cents / 100).toLocaleString('es-MX', {
    minimumFractionDigits: cents % 100 ? 2 : 0,
    maximumFractionDigits: 2,
  })} MXN`;

const { minSeats, maxSeats, seatPrice, plans } = groupOffer;
const regularSeat = anahuacProgram.pricing.total;

/** "Hoy" plus the monthly dates; relative until the client knows today's date. */
const chargeDates = (installments: number, today: Date | null) =>
  today
    ? installmentDates(installments, today).map((d, i) => (i === 0 ? 'Hoy' : formatDay(d)))
    : Array.from({ length: installments }, (_, i) =>
        i === 0 ? 'Hoy' : `En ${i} ${i === 1 ? 'mes' : 'meses'}`,
      );

/**
 * Seats + plan picker for /grupos-anahuac. No lead form: the API creates a
 * Stripe Checkout for the chosen seats and the buyer goes straight there.
 */
const GroupCheckout = () => {
  const [seats, setSeats] = useState<number>(minSeats);
  const [plan, setPlan] = useState<GroupPlanId>('1');
  const [status, setStatus] = useState<'idle' | 'sending' | 'error' | 'closed'>('idle');
  // The page is prerendered, so today's date is only known in the browser.
  const [today, setToday] = useState<Date | null>(null);
  useEffect(() => setToday(todayInCancun()), []);

  const clamp = (n: number) => Math.min(maxSeats, Math.max(minSeats, Math.round(n) || minSeats));
  const total = seatPrice * seats;
  const chosen = plans.find((p) => p.id === plan)!;
  const perPayment = installmentCents(chosen.installments) * seats;
  const chosenDates = chargeDates(chosen.installments, today);

  const pay = async () => {
    setStatus('sending');
    try {
      const res = await fetch('/api/anahuac/grupos/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seats, plan }),
      });
      const body = await res.json().catch(() => ({}));
      if (res.ok && body.url) {
        window.location.href = body.url;
        return;
      }
      setStatus(body.reason === 'closed' ? 'closed' : 'error');
    } catch {
      setStatus('error');
    }
  };

  return (
    <section id="inscripcion" className="scroll-mt-24 bg-navy py-16 text-white md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <span className="font-heading text-sm font-semibold uppercase tracking-widest text-anahuac-300">
            Grupos y empresas
          </span>
          <h2 className="mt-2 font-heading text-white">Inscribe a tu equipo</h2>
          <p className="text-lg text-white/80">
            {groupOffer.discount}% de descuento para grupos de {minSeats} personas o
            más, sin pago de inscripción. Elige cuántos lugares necesitas y paga en
            una sola exhibición o hasta en 3 pagos sin intereses.
          </p>
        </div>

        <div className="mx-auto mt-12 max-w-3xl rounded-2xl border-2 border-anahuac bg-white p-6 text-navy shadow-2xl md:p-10">
          <span className="inline-flex items-center gap-2 rounded-full bg-anahuac px-4 py-1.5 text-sm font-semibold uppercase tracking-wide text-white">
            <BadgeCheck size={15} aria-hidden="true" />
            {groupOffer.discount}% de descuento · hasta el {groupOffer.deadline}
          </span>

          {/* Seats */}
          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <label htmlFor="seats" className="flex items-center gap-2 font-heading text-lg font-semibold">
                <Users size={20} className="text-anahuac" aria-hidden="true" />
                Número de lugares
              </label>
              <p className="my-0 text-sm text-muted-foreground">
                Mínimo {minSeats}, máximo {maxSeats}.{' '}
                <span className="line-through">{formatMXN(regularSeat)}</span>{' '}
                <strong className="text-navy">{formatMXN(seatPrice)}</strong> por
                persona.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSeats((s) => clamp(s - 1))}
                disabled={seats <= minSeats}
                aria-label="Quitar un lugar"
                className="flex h-12 w-12 items-center justify-center rounded-lg border border-border transition-colors hover:border-anahuac disabled:opacity-40"
              >
                <Minus size={18} aria-hidden="true" />
              </button>
              <input
                id="seats"
                type="number"
                inputMode="numeric"
                min={minSeats}
                max={maxSeats}
                value={seats}
                onChange={(e) => setSeats(Number(e.target.value))}
                onBlur={() => setSeats((s) => clamp(s))}
                className="h-12 w-20 rounded-lg border border-border text-center font-heading text-xl font-bold focus:border-anahuac focus:outline-none focus:ring-2 focus:ring-anahuac/30"
              />
              <button
                type="button"
                onClick={() => setSeats((s) => clamp(s + 1))}
                disabled={seats >= maxSeats}
                aria-label="Agregar un lugar"
                className="flex h-12 w-12 items-center justify-center rounded-lg border border-border transition-colors hover:border-anahuac disabled:opacity-40"
              >
                <Plus size={18} aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Plan */}
          <fieldset className="mt-8">
            <legend className="font-heading text-lg font-semibold">Forma de pago</legend>
            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
              {plans.map((p) => {
                const each = installmentCents(p.installments) * clamp(seats);
                return (
                  <label
                    key={p.id}
                    className="flex cursor-pointer flex-col rounded-xl border-2 border-border p-4 transition-colors has-[:checked]:border-anahuac has-[:checked]:bg-anahuac-50"
                  >
                    <span className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="plan"
                        value={p.id}
                        checked={plan === p.id}
                        onChange={() => setPlan(p.id)}
                        className="accent-anahuac"
                      />
                      <span className="font-heading font-semibold">{p.label}</span>
                    </span>
                    <span className="mt-2 font-heading text-xl font-bold text-anahuac">
                      {p.installments > 1 ? `${p.installments} × ` : ''}
                      {money(each)}
                    </span>
                    <ul className="mb-0 mt-2 space-y-0.5 pl-0 text-xs text-muted-foreground">
                      {chargeDates(p.installments, today).map((d) => (
                        <li key={d} className="list-none">
                          {d}
                        </li>
                      ))}
                    </ul>
                  </label>
                );
              })}
            </div>
          </fieldset>

          {/* Summary */}
          <dl className="mt-8 space-y-3 border-t border-border pt-6">
            <div className="flex justify-between">
              <dt>
                {seats} lugares × {formatMXN(seatPrice)}
              </dt>
              <dd className="font-semibold">{formatMXN(total)}</dd>
            </div>
            <div className="flex justify-between text-success">
              <dt>Ahorro del grupo</dt>
              <dd className="font-semibold">{formatMXN((regularSeat - seatPrice) * seats)}</dd>
            </div>
            <div className="flex items-baseline justify-between pt-2">
              <dt className="font-heading text-lg">
                {chosen.installments > 1 ? 'Pagas hoy' : 'Total'}
              </dt>
              <dd className="font-heading text-3xl font-bold text-anahuac">{money(perPayment)}</dd>
            </div>
            {chosen.installments > 1 && (
              <p className="my-0 text-right text-sm text-muted-foreground">
                y {chosen.installments - 1} pago{chosen.installments > 2 ? 's' : ''} más de{' '}
                {money(perPayment)}{' '}
                {today ? `el ${listEs(chosenDates.slice(1))}` : 'cada mes'}, con la misma
                tarjeta. Total {formatMXN(total)}, sin intereses.
              </p>
            )}
          </dl>

          <button
            type="button"
            onClick={pay}
            disabled={status === 'sending'}
            className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-anahuac px-8 py-4 font-heading text-base font-semibold tracking-wide text-white shadow-lg shadow-anahuac/30 transition-colors hover:bg-anahuac-600 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {status === 'sending' ? (
              <>
                <Loader2 size={18} className="animate-spin" aria-hidden="true" />
                ABRIENDO PAGO SEGURO…
              </>
            ) : (
              <>
                PAGAR {seats} LUGARES
                <ArrowRight size={18} aria-hidden="true" />
              </>
            )}
          </button>

          {status === 'error' && (
            <p role="alert" className="mb-0 mt-4 text-center text-sm text-danger">
              No pudimos abrir el pago. Intenta de nuevo o escríbenos.
            </p>
          )}
          {status === 'closed' && (
            <p role="alert" className="mb-0 mt-4 text-center text-sm text-danger">
              La promoción para grupos cerró el {groupOffer.deadline}.
            </p>
          )}
          <p className="mb-0 mt-4 text-center text-sm text-muted-foreground">
            Pago seguro con Stripe. Después del pago te contactamos para registrar a
            cada participante con la universidad.
          </p>
        </div>
      </div>
    </section>
  );
};

export default GroupCheckout;
