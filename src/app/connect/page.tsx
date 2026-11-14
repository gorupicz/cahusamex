import type { Metadata } from 'next';
import { Suspense } from 'react';
import ConnectApp from '@/components/connect/ConnectApp';

export const metadata: Metadata = {
  title: 'Connect',
  description:
    'Describe a quién quieres conocer y te presentamos por correo con las personas de la comunidad de CAHUSA MX que encajan.',
  alternates: { canonical: '/connect' },
};

export default function ConnectPage() {
  return (
    <section className="container mx-auto px-4 py-12 md:py-16">
      <header className="mb-8 max-w-3xl">
        <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-teal">Connect · CAHUSA MX</p>
        <h1 className="font-heading text-4xl text-navy md:text-5xl">Connect</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Describe a tu cliente ideal. Buscamos en toda la comunidad de CAHUSA MX y Esteban te presenta por correo con quien elijas.
        </p>
      </header>
      {/* useSearchParams (?intro=, ?checkout=) needs a Suspense boundary. */}
      <Suspense fallback={null}>
        <ConnectApp />
      </Suspense>
    </section>
  );
}
