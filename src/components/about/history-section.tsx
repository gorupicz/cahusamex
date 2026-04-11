import { siteConfig } from '@/data/site-config';

const HistorySection = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-16">
      <div>
        <h2 className="text-navy mb-6">Nuestra Historia</h2>
        <p className="text-gray-600">
          La {siteConfig.name} promueve la competitividad en la industria del bien raíz de renta vacacional en México y USA.
          Nacimos en la Riviera Maya, el mercado turístico más grande de América Latina, con la visión
          de agrupar a los principales operadores e impulsar la profesionalización del sector.
        </p>
        <p className="text-gray-600">
          Desde nuestros inicios, desarrollamos planes de capacitación y vinculación, y creamos estándares
          de excelencia tomando en cuenta el impacto social y ambiental de nuestra industria.
        </p>
      </div>
      <div className="rounded-xl overflow-hidden shadow-lg">
        <img
          src="/lovable-uploads/27c70ccd-6775-4d50-84e2-e2cd60f72589.png"
          alt="Riviera Maya"
          className="w-full h-auto"
        />
      </div>
    </div>
  );
};

export default HistorySection;
