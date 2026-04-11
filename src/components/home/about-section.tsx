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
          La {siteConfig.name} promueve la competitividad en la industria del bien raíz de renta vacacional en México y USA.
          Nacimos en la Riviera Maya, el mercado turístico más grande de América Latina.
        </p>
      </div>

      <div className="bg-navy-light text-white p-8 rounded-xl mb-16">
        <h3 className="text-2xl md:text-3xl font-bold text-center mb-4">NUESTRO PROPÓSITO</h3>
        <p className="text-xl md:text-2xl text-center">
          Promover la competitividad y la excelencia en la industria de renta vacacional
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <FeatureCard
          title="Principales Operadores"
          description="Agrupamos a los principales operadores de renta vacacional en México y USA."
          icon={Users}
        />
        <FeatureCard
          title="Capacitación y Vinculación"
          description="Desarrollamos planes de capacitación y vinculación para impulsar el crecimiento de la industria."
          icon={Book}
        />
        <FeatureCard
          title="Estándares de Excelencia"
          description="Creamos estándares de excelencia tomando en cuenta el impacto social y ambiental."
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
