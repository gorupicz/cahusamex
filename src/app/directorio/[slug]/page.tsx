import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Globe, Linkedin, MessageCircle, Send } from 'lucide-react';
import ProfileAvatar from '@/components/directory/ProfileAvatar';
import { CATEGORY_LABELS, CONNECT_PATH, DIRECTORY_PATH, KIND_LABELS } from '@/lib/directory/config';
import { getPublished } from '@/lib/server/public';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const profile = await getPublished(slug);
  if (!profile) return { title: 'Perfil no encontrado', robots: { index: false } };
  return {
    title: profile.name,
    description: profile.headline ?? [profile.job_title, profile.company, profile.city].filter(Boolean).join(' · '),
    alternates: { canonical: `${DIRECTORY_PATH}/${profile.slug}` },
  };
}

const external = { target: '_blank', rel: 'noopener noreferrer' } as const;

export default async function ProfilePage({ params }: Props) {
  const { slug } = await params;
  const profile = await getPublished(slug);
  if (profile === null) notFound();
  if (profile === undefined) {
    return (
      <section className="container mx-auto px-4 py-16 text-center text-muted-foreground">
        No pudimos cargar este perfil. Intenta de nuevo en un momento.
      </section>
    );
  }

  const hasContact = profile.website || profile.linkedin_url || profile.whatsapp;
  const whatsappText = encodeURIComponent(`Hola ${profile.name}, te encontré en el directorio de CAHUSA MX.`);

  return (
    <section className="container mx-auto max-w-4xl px-4 py-12 md:py-16">
      <Link href={DIRECTORY_PATH} className="mb-8 inline-flex items-center gap-2 text-sm text-teal hover:underline">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Volver al directorio
      </Link>

      <div className="rounded-2xl border bg-white p-6 shadow-sm md:p-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <ProfileAvatar name={profile.name} photoUrl={profile.photo_url} className="h-24 w-24 text-2xl" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-heading text-3xl text-navy">{profile.name}</h1>
              {profile.featured && (
                <span className="rounded-full bg-gold-light/30 px-2 py-0.5 text-xs font-medium text-gold-dark">Destacado</span>
              )}
            </div>
            {(profile.job_title || profile.company) && (
              <p className="mt-1 text-lg text-muted-foreground">
                {[profile.job_title, profile.kind === 'professional' ? profile.company : null].filter(Boolean).join(' · ')}
              </p>
            )}
            {profile.headline && <p className="mt-3 text-navy">{profile.headline}</p>}
            <p className="mt-3 text-sm text-muted-foreground">
              {[KIND_LABELS[profile.kind], profile.city, ...profile.categories.map((c) => CATEGORY_LABELS[c])].filter(Boolean).join(' · ')}
            </p>
          </div>
        </div>

        {profile.description && (
          <div className="mt-8">
            <h2 className="mb-2 font-heading text-xl text-navy">Acerca de</h2>
            <p className="whitespace-pre-line text-navy/90">{profile.description}</p>
          </div>
        )}

        {profile.services.length > 0 && (
          <div className="mt-8">
            <h2 className="mb-3 font-heading text-xl text-navy">Servicios</h2>
            <ul className="flex flex-wrap gap-2">
              {profile.services.map((s) => (
                <li key={s} className="rounded-full bg-primary-50 px-3 py-1 text-sm text-navy">
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-10 border-t pt-8">
          <h2 className="mb-4 font-heading text-xl text-navy">Contacto</h2>
          <div className="flex flex-wrap items-center gap-3">
            {/* Contact goes through an intro: Esteban introduces both by email. */}
            <Link href={`${CONNECT_PATH}?intro=${profile.slug}`} className="btn-primary inline-flex items-center gap-2">
              <Send className="h-4 w-4" aria-hidden="true" />
              Pedir intro
            </Link>
            {profile.website && (
              <a href={profile.website} {...external} className="btn-outline inline-flex items-center gap-2">
                <Globe className="h-4 w-4" aria-hidden="true" />
                Sitio web<span className="sr-only"> (abre en una pestaña nueva)</span>
              </a>
            )}
            {profile.linkedin_url && (
              <a href={profile.linkedin_url} {...external} className="btn-outline inline-flex items-center gap-2">
                <Linkedin className="h-4 w-4" aria-hidden="true" />
                LinkedIn<span className="sr-only"> (abre en una pestaña nueva)</span>
              </a>
            )}
            {profile.whatsapp && (
              <a href={`https://wa.me/${profile.whatsapp}?text=${whatsappText}`} {...external} className="btn-outline inline-flex items-center gap-2">
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
                WhatsApp<span className="sr-only"> (abre en una pestaña nueva)</span>
              </a>
            )}
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Esteban Gorupicz te presenta por correo, con copia para ti.
            {!hasContact && ' Este perfil no tiene otros datos de contacto públicos.'}
          </p>
        </div>

        <p className="mt-8 text-xs text-muted-foreground">
          Actualizado el {new Date(profile.updated_at).toLocaleDateString('es-MX', { dateStyle: 'long', timeZone: 'America/Cancun' })}
        </p>
      </div>
    </section>
  );
}
