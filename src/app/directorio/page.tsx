import type { Metadata } from 'next';
import Link from 'next/link';
import DirectoryList from '@/components/directory/DirectoryList';
import { CONNECT_PATH, EDIT_PATH } from '@/lib/directory/config';
import { listPublished } from '@/lib/server/public';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Directorio',
  description:
    'Empresas y profesionales de la comunidad de CAHUSA MX: renta vacacional, hotelería, administración de propiedades, bienes raíces y servicios en México y USA.',
  alternates: { canonical: '/directorio' },
};

export default async function DirectoryPage() {
  const profiles = await listPublished();

  return (
    <section className="container mx-auto px-4 py-12 md:py-16">
      <header className="mb-10 max-w-3xl">
        <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-teal">Comunidad · CAHUSA MX</p>
        <h1 className="font-heading text-4xl text-navy md:text-5xl">Directorio</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Empresas y profesionales de la comunidad de la Cámara Empresarial de la Hospitalidad USA - México. Encuentra con quién
          trabajar y pide una intro.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href={EDIT_PATH} className="btn-primary">
            Agregar o editar mi perfil
          </Link>
          <Link href={CONNECT_PATH} className="btn-outline">
            Pedir intros con Connect
          </Link>
        </div>
      </header>

      {profiles ? (
        <DirectoryList profiles={profiles} />
      ) : (
        <p className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
          No pudimos cargar el directorio. Intenta de nuevo en un momento.
        </p>
      )}
    </section>
  );
}
