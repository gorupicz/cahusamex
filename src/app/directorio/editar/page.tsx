import type { Metadata } from 'next';
import { Suspense } from 'react';
import ProfileEditor from '@/components/directory/ProfileEditor';

export const metadata: Metadata = {
  title: 'Mi perfil en el directorio',
  description: 'Reclama, completa y publica tu perfil en el directorio de CAHUSA MX.',
  robots: { index: false, follow: false },
};

export default function EditProfilePage() {
  return (
    <section className="container mx-auto max-w-4xl px-4 py-12 md:py-16">
      <header className="mb-8">
        <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-teal">Directorio · CAHUSA MX</p>
        <h1 className="font-heading text-4xl text-navy">Tu perfil</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Si te registraste a un evento de CAHUSA MX ya tenemos un borrador con tus datos de Luma. Nadie lo ve hasta que tú lo publicas.
        </p>
      </header>
      {/* useSearchParams (?next=) needs a Suspense boundary. */}
      <Suspense fallback={null}>
        <ProfileEditor />
      </Suspense>
    </section>
  );
}
