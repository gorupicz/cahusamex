import type { Metadata } from 'next';
import Link from 'next/link';
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  Mail,
  MapPin,
  MessageCircle,
} from 'lucide-react';
import { anahuacProgram, formatMXN } from '@/data/anahuac';
import { siteConfig } from '@/data/site-config';

const { facts, pricing } = anahuacProgram;
const beca = pricing.scholarship;

export const metadata: Metadata = {
  title: 'Inscripción confirmada | Certificación en IA Aplicada',
  description: 'Tu inscripción a la Certificación en Herramientas de IA Aplicadas a Productividad Profesional quedó registrada.',
  // A confirmation page has no business in search results.
  robots: { index: false, follow: false },
};

export default function GraciasPage() {
  return (
    <section className="section-container">
      <div className="mx-auto max-w-2xl">
        <div className="rounded-2xl border-2 border-anahuac bg-white p-8 text-center shadow-lg md:p-12">
          <CheckCircle2
            size={56}
            className="mx-auto text-success"
            aria-hidden="true"
          />

          <h1 className="mt-6 font-heading text-3xl text-navy md:text-4xl">
            ¡Tu lugar está apartado!
          </h1>

          <p className="text-lg text-muted-foreground">
            Recibimos tu inscripción a la{' '}
            <strong className="text-navy">
              Certificación en Herramientas de IA Aplicadas a Productividad
              Profesional
            </strong>{' '}
            de la {anahuacProgram.institution}.
          </p>

          <div className="my-8 rounded-xl bg-anahuac-50 p-6 text-left">
            <p className="my-0 font-heading font-semibold text-anahuac-700">
              Lo que sigue
            </p>
            <ol className="mt-4 space-y-3 text-navy">
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-anahuac text-sm font-bold text-white">
                  1
                </span>
                <span>
                  Te llega el comprobante de pago de tu inscripción por correo,
                  de parte de Stripe.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-anahuac text-sm font-bold text-white">
                  2
                </span>
                <span>
                  Nos ponemos en contacto contigo para coordinar el pago del
                  programa ({formatMXN(beca.tuition)} con la beca aplicada) y
                  completar tu registro con la universidad.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-anahuac text-sm font-bold text-white">
                  3
                </span>
                <span>
                  Antes del inicio recibes el calendario de sesiones y los
                  accesos que vas a necesitar.
                </span>
              </li>
            </ol>
          </div>

          <div className="grid grid-cols-1 gap-3 text-left sm:grid-cols-3">
            {[
              { icon: MapPin, label: 'Modalidad', value: facts.modality },
              { icon: Clock, label: 'Duración', value: facts.duration },
              { icon: CalendarDays, label: 'Inicio', value: facts.start },
            ].map(({ icon: Icon, label, value }) => (
              <div
                key={label}
                className="rounded-xl border border-border px-4 py-3"
              >
                <Icon
                  size={18}
                  className="text-anahuac"
                  aria-hidden="true"
                />
                <p className="my-0 mt-2 text-xs uppercase tracking-wide text-muted-foreground">
                  {label}
                </p>
                <p className="my-0 font-heading font-semibold text-navy">
                  {value}
                </p>
              </div>
            ))}
          </div>

          <p className="mt-8 text-sm text-muted-foreground">
            ¿Dudas sobre tu inscripción? Escríbenos y te respondemos.
          </p>

          <div className="mt-4 flex flex-col justify-center gap-3 sm:flex-row">
            <a
              href={`mailto:${siteConfig.email}?subject=Inscripción Certificación IA Anáhuac`}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-navy px-6 py-3 font-heading font-semibold text-white transition-colors hover:bg-navy-light"
            >
              <Mail size={18} aria-hidden="true" />
              {siteConfig.email}
            </a>
            <a
              href={siteConfig.whatsapp.channel}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-lg border-2 border-navy px-6 py-3 font-heading font-semibold text-navy transition-colors hover:bg-navy hover:text-white"
            >
              <MessageCircle size={18} aria-hidden="true" />
              WhatsApp
            </a>
          </div>
        </div>

        <p className="mt-8 text-center">
          <Link
            href="/anahuac"
            className="text-sm font-medium text-navy underline underline-offset-4 transition-colors hover:text-anahuac"
          >
            Volver a la página del programa
          </Link>
        </p>
      </div>
    </section>
  );
}
