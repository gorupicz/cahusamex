import Link from 'next/link';
import { MapPin, Users, ShoppingBag } from 'lucide-react';

const DinnerHighlight = () => {
  return (
    <section className="bg-navy text-white py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Serie de Cenas 2025-2026</h2>
          <p className="max-w-3xl mx-auto text-lg">
            24 experiencias culinarias únicas en las principales ciudades de México
          </p>
        </div>

        <div className="bg-white/10 rounded-xl p-6 md:p-8 mb-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="mb-6 md:mb-0 md:mr-8">
              <h3 className="text-2xl font-bold mb-4">Conecta con los mejores Property Managers</h3>
              <p className="mb-4">
                De abril 2025 a marzo 2026, organizamos cenas exclusivas en 24 ciudades de México para crear conexiones valiosas en un ambiente relajado.
              </p>
              <div className="mb-4">
                <div className="flex items-center mb-2">
                  <MapPin className="h-5 w-5 mr-2 text-teal-light" />
                  <span>121,500 propiedades representadas en estas ciudades</span>
                </div>
                <div className="flex items-center mb-2">
                  <Users className="h-5 w-5 mr-2 text-teal-light" />
                  <span>Managers de aproximadamente 10% del mercado</span>
                </div>
                <div className="flex items-center">
                  <ShoppingBag className="h-5 w-5 mr-2 text-teal-light" />
                  <span>Solo 3 espacios de patrocinio disponibles por cena</span>
                </div>
              </div>
            </div>
            <div className="w-full md:w-1/3">
              <img
                src="/lovable-uploads/944c4e44-f0bf-41d6-8f00-9bd40b07af2b.png"
                alt="Cenas de Networking"
                className="rounded-lg w-full h-auto shadow-lg"
              />
            </div>
          </div>
        </div>

        <div className="text-center">
          <Link href="/activities#dinner-series" className="bg-white text-navy px-8 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors inline-block">
            Ver todas las ciudades
          </Link>
        </div>
      </div>
    </section>
  );
};

export default DinnerHighlight;
