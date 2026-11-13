import type { Metadata } from 'next';
import {
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  Clock,
  MapPin,
  Sparkles,
} from 'lucide-react';
import ReservarButton from '@/components/anahuac/reservar-button';
import InstagramEmbed from '@/components/anahuac/instagram-embed';
import InscriptionForm from '@/components/anahuac/inscription-form';
import { anahuacProgram, formatMXN } from '@/data/anahuac';
import { siteConfig } from '@/data/site-config';

const { facts, pricing, tools, audience, modules, benefits } = anahuacProgram;
const beca = pricing.scholarship;

export const metadata: Metadata = {
  title: 'Certificación en IA Aplicada | Universidad Anáhuac Cancún',
  description: anahuacProgram.description,
  alternates: { canonical: `${siteConfig.url}/anahuac` },
  openGraph: {
    title: `${anahuacProgram.name} — ${anahuacProgram.institution}`,
    description: anahuacProgram.description,
    type: 'website',
    url: `${siteConfig.url}/anahuac`,
  },
};

export default function AnahuacPage() {
  return (
    <>
      {/* ---------------------------------------------------------------- Hero */}
      <section className="relative overflow-hidden bg-navy text-white">
        <div
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{
            backgroundImage:
              'radial-gradient(circle at 80% 15%, rgba(255,89,0,0.5) 0%, transparent 45%), radial-gradient(circle at 10% 90%, rgba(42,125,176,0.5) 0%, transparent 50%)',
          }}
          aria-hidden="true"
        />

        <div className="container relative mx-auto px-4 py-16 md:py-24">
          {/* Co-branding lockup */}
          <div className="mb-10 flex flex-wrap items-center gap-4">
            <img
              src={siteConfig.logo}
              alt={siteConfig.name}
              className="h-14 w-auto rounded-lg bg-white/95 p-2"
            />
            <span className="text-2xl font-light text-white/50">×</span>
            {/* Square badge that carries its own orange field — no white chip. */}
            <img
              src={anahuacProgram.logo}
              alt={anahuacProgram.institution}
              className="h-14 w-14 rounded-lg"
            />
          </div>

          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-anahuac px-4 py-1.5 text-sm font-semibold uppercase tracking-wide text-white">
                <Sparkles size={15} aria-hidden="true" />
                Inscripciones abiertas
              </span>

              <h1 className="mt-6 font-heading text-4xl font-bold leading-[1.15] md:text-5xl lg:text-6xl">
                Certificación en Herramientas de{' '}
                <span className="text-anahuac-300">IA Aplicadas</span> a
                Productividad Profesional
              </h1>

              <p className="mt-4 font-heading text-xl text-white/80 md:text-2xl">
                {anahuacProgram.institution}
              </p>

              <p className="max-w-2xl text-lg text-white/85">
                Aprende a usar la inteligencia artificial para trabajar de forma
                más eficiente, ahorrar tiempo y mejorar tus resultados
                profesionales. Sin programar. 🚀
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                {[
                  { icon: MapPin, label: 'Modalidad', value: facts.modality },
                  { icon: Clock, label: 'Duración', value: facts.duration },
                  { icon: CalendarDays, label: 'Inicio', value: facts.start },
                ].map(({ icon: Icon, label, value }) => (
                  <div
                    key={label}
                    className="flex items-center gap-3 rounded-xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm"
                  >
                    <Icon size={20} className="text-anahuac-300" aria-hidden="true" />
                    <div className="leading-tight">
                      <p className="my-0 text-xs uppercase tracking-wide text-white/60">
                        {label}
                      </p>
                      <p className="my-0 font-semibold">{value}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* CTA 1 */}
              <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
                <ReservarButton />
                <a
                  href="#temario"
                  className="inline-flex items-center justify-center rounded-lg border-2 border-white/30 px-8 py-4 font-heading text-base font-semibold tracking-wide transition-colors hover:border-white hover:bg-white/10"
                >
                  Ver el temario
                </a>
              </div>

              <p className="mt-4 text-sm text-white/70">
                🔥 Beca La Bolsa MX / CAHUSAMEX: {beca.discount}% de descuento
                inscribiéndote antes del {beca.deadline}.
              </p>
            </div>

            <InstagramEmbed />
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------- Beca strip */}
      <section className="bg-anahuac text-white">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 py-5 text-center md:flex-row md:text-left">
          <p className="my-0 font-heading text-lg font-semibold">
            🔥 {beca.label}: {beca.discount}% de descuento hasta el{' '}
            {beca.deadline}
          </p>
          <p className="my-0 text-white/90">
            Total promocional{' '}
            <strong className="font-heading text-xl">
              {formatMXN(beca.total)}
            </strong>{' '}
            <span className="text-white/70 line-through">
              {formatMXN(pricing.total)}
            </span>
          </p>
        </div>
      </section>

      {/* ------------------------------------------------------ Para quién es */}
      <section className="section-container">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-heading text-navy">¿Para quién es esta certificación?</h2>
          <p className="text-lg text-muted-foreground">
            Para quienes quieren dejar de perder horas en tareas operativas y
            usar la IA como una ventaja real en su trabajo o negocio.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {audience.map((item) => (
            <div
              key={item.title}
              className="card-hover rounded-2xl border-t-4 border-anahuac bg-white p-6 shadow-md"
            >
              <h3 className="my-0 font-heading text-xl text-navy">{item.title}</h3>
              <p className="mb-0 text-muted-foreground">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* --------------------------------------------------------- Herramientas */}
      <section className="bg-white py-16 md:py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-heading text-navy">El stack que vas a dominar</h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Aplicado a tareas reales: redacción, análisis de información,
            presentaciones, reportes, reuniones, organización de documentos y
            productividad diaria.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-3">
            {tools.map((tool) => (
              <span
                key={tool}
                className="rounded-full border border-anahuac-200 bg-anahuac-50 px-6 py-3 font-heading font-semibold text-anahuac-700"
              >
                {tool}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------- Temario */}
      <section id="temario" className="section-container scroll-mt-24">
        <div className="mx-auto max-w-3xl text-center">
          <span className="font-heading text-sm font-semibold uppercase tracking-widest text-anahuac">
            Temario
          </span>
          <h2 className="mt-2 font-heading text-navy">6 módulos, 10 semanas</h2>
          <p className="text-lg text-muted-foreground">
            Cada módulo cierra con algo que puedes usar el lunes siguiente en tu
            trabajo.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {modules.map((module, index) => (
            <article
              key={module.title}
              className="card-hover flex h-full flex-col rounded-2xl bg-white p-7 shadow-md"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-anahuac font-heading text-lg font-bold text-white">
                {index + 1}
              </span>
              <h3 className="mb-2 mt-4 font-heading text-xl leading-snug text-navy">
                {module.title}
              </h3>
              <p className="my-0 text-muted-foreground">{module.description}</p>
            </article>
          ))}
        </div>

        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {benefits.map((benefit) => (
            <div key={benefit} className="flex items-start gap-3">
              <CheckCircle2
                size={22}
                className="mt-0.5 shrink-0 text-anahuac"
                aria-hidden="true"
              />
              <p className="my-0 text-navy">{benefit}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------ Inversión */}
      <section id="inversion" className="bg-navy py-16 text-white md:py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="font-heading text-white">Inversión</h2>
            <p className="text-lg text-white/80">
              Inscribiéndote antes del {beca.deadline} obtienes{' '}
              {beca.discount}% de descuento sobre el costo del programa.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-2">
            {/* Regular */}
            <div className="rounded-2xl border border-white/15 bg-white/5 p-8">
              <h3 className="my-0 font-heading text-2xl text-white/90">
                Inversión regular
              </h3>
              <dl className="mt-6 space-y-3 text-white/80">
                <div className="flex justify-between border-b border-white/10 pb-3">
                  <dt>Inscripción</dt>
                  <dd className="font-semibold">
                    {formatMXN(pricing.enrollment)}
                  </dd>
                </div>
                <div className="flex justify-between border-b border-white/10 pb-3">
                  <dt>Programa</dt>
                  <dd className="font-semibold">{formatMXN(pricing.tuition)}</dd>
                </div>
                <div className="flex items-baseline justify-between pt-2">
                  <dt className="font-heading text-lg text-white">Total</dt>
                  <dd className="font-heading text-3xl font-bold text-white">
                    {formatMXN(pricing.total)}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Beca */}
            <div className="relative rounded-2xl border-2 border-anahuac bg-white p-8 text-navy shadow-2xl">
              <span className="absolute -top-4 left-8 inline-flex items-center gap-2 rounded-full bg-anahuac px-4 py-1.5 text-sm font-semibold uppercase tracking-wide text-white">
                <BadgeCheck size={15} aria-hidden="true" />
                {beca.discount}% de descuento
              </span>

              <h3 className="my-0 font-heading text-2xl text-navy">
                🔥 {beca.label}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Válida para inscripciones antes del {beca.deadline}.
              </p>

              <dl className="mt-6 space-y-3">
                <div className="flex justify-between border-b border-border pb-3">
                  <dt>Programa con descuento</dt>
                  <dd className="font-semibold">
                    <span className="mr-2 text-muted-foreground line-through">
                      {formatMXN(pricing.tuition)}
                    </span>
                    {formatMXN(beca.tuition)}
                  </dd>
                </div>
                <div className="flex justify-between border-b border-border pb-3">
                  <dt>Inscripción</dt>
                  <dd className="font-semibold">
                    {formatMXN(beca.enrollment)}
                  </dd>
                </div>
                <div className="flex items-baseline justify-between pt-2">
                  <dt className="font-heading text-lg">Total promocional</dt>
                  <dd className="font-heading text-3xl font-bold text-anahuac">
                    {formatMXN(beca.total)}
                  </dd>
                </div>
              </dl>

              <p className="mt-4 text-sm font-medium text-success">
                Ahorras {formatMXN(beca.savings)}
              </p>

              {/* CTA 2 */}
              <ReservarButton className="mt-6 w-full" />
            </div>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------- Inscripción */}
      <section id="inscripcion" className="section-container scroll-mt-24">
        <div className="mx-auto max-w-3xl text-center">
          <span className="font-heading text-sm font-semibold uppercase tracking-widest text-anahuac">
            Inscripción
          </span>
          <h2 className="mt-2 font-heading text-navy">Reserva tu lugar</h2>
          <p className="text-lg text-muted-foreground">
            Completa tus datos y reserva tu inscripción. Los lugares se asignan
            por orden de pago confirmado.
          </p>
        </div>

        {/* CTA 3 — the form's own submit button */}
        <div className="mt-10">
          <InscriptionForm />
        </div>
      </section>
    </>
  );
}
