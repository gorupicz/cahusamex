import Link from 'next/link';
import FeatureCard from '@/components/FeatureCard';
import { Users, Calendar, Book } from 'lucide-react';
import { siteConfig } from '@/data/site-config';

const AboutSection = () => {
  return (
    <section className="section-container">
      <div className="text-center mb-12">
        <h2 className="text-navy mb-4">¿Quiénes Somos?</h2>
        <p className="max-w-3xl mx-auto text-lg text-gray-600">
          La {siteConfig.name} reúne a los mejores Property Managers y Anfitriones de México.
          Nacimos en la Riviera Maya, el mercado turístico más grande de América Latina.
        </p>
      </div>

      <div className="bg-navy-light text-white p-8 rounded-xl mb-16">
        <h3 className="text-2xl md:text-3xl font-bold text-center mb-4">NUESTRO PROPÓSITO</h3>
        <p className="text-xl md:text-2xl text-center">
          Apoyar a los Anfitriones a Convertirse en Líderes
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <FeatureCard
          title="Networking"
          description="Organizamos cenas para networking y eventos que conectan a los profesionales de la industria."
          icon={Users}
        />
        <FeatureCard
          title="Aprendizaje"
          description="Workshops para aprender e inspirar con expertos en el mercado de renta vacacional."
          icon={Book}
        />
        <FeatureCard
          title="Comunidad"
          description="Grupos de WhatsApp para anfitriones por ciudad y Property Managers por región."
          icon={Calendar}
        />
      </div>

      <div className="mt-12 text-center">
        <Link href="/about" className="btn-outline">
          Conoce más sobre nosotros
        </Link>
      </div>
    </section>
  );
};

export default AboutSection;
