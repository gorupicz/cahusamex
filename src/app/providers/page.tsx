import type { Metadata } from 'next';
import Hero from '@/components/Hero';
import ProvidersIntro from '@/components/providers/providers-intro';
import ProvidersStats from '@/components/providers/providers-stats';
import ProvidersBenefits from '@/components/providers/providers-benefits';
import ProvidersGallery from '@/components/providers/providers-gallery';
import ProvidersCarousel from '@/components/providers/providers-carousel';
import ProvidersCta from '@/components/providers/providers-cta';

export const metadata: Metadata = {
  title: 'Proveedores',
  description:
    'Conecta tu empresa con miles de propietarios y administradores de rentas vacacionales en México y USA afiliándote como proveedor de la Cámara.',
};

export default function ProvidersPage() {
  return (
    <>
      <Hero
        title="Proveedores"
        subtitle="Conecta tu empresa con la red de operadores de renta vacacional más importante de México y USA"
        backgroundImage="/uploads/providers-hero.jpg"
      />
      <section className="section-container">
        <ProvidersIntro />
        <ProvidersStats />
        <ProvidersBenefits />
        <ProvidersGallery />
        <ProvidersCta />
        <div className="mt-16 pt-16 border-t border-gray-200">
          <ProvidersCarousel />
        </div>
      </section>
    </>
  );
}
