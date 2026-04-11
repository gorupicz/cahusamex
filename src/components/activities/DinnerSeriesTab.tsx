import DinnerSeriesTable from '@/components/DinnerSeriesTable';
import { siteConfig } from '@/data/site-config';

const DinnerSeriesTab = () => {
  return (
    <>
      <DinnerSeriesTable />

      <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <img
            src="/lovable-uploads/944c4e44-f0bf-41d6-8f00-9bd40b07af2b.png"
            alt="Cenas de Networking"
            className="w-full h-64 object-cover"
          />
          <div className="p-6">
            <h3 className="text-xl font-bold text-navy mb-2">Experiencia Culinaria Única</h3>
            <p className="text-gray-600">
              Nuestras cenas son experiencias culinarias seleccionadas y oportunidades para conectar con los principales property managers en un ambiente muy relajado, donde las conversaciones fluyen naturalmente.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <img
            src="/lovable-uploads/d5231b7b-dcfd-4ed8-ae93-69197b4a2bad.png"
            alt="Property Managers"
            className="w-full h-64 object-cover"
          />
          <div className="p-6">
            <h3 className="text-xl font-bold text-navy mb-2">Conexiones Valiosas</h3>
            <p className="text-gray-600">
              Según AirDNA, estas 24 ciudades representan 121,500 propiedades en plataformas de renta vacacional. Esperamos tener a los administradores del 10% de estas propiedades participando en nuestros eventos.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-10 text-center">
        <a
          href={siteConfig.events.dinners}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary inline-block"
        >
          Regístrate para las próximas cenas
        </a>
      </div>
    </>
  );
};

export default DinnerSeriesTab;
