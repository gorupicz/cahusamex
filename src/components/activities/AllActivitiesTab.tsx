
import ActivityCard from '@/components/ActivityCard';
import { Dispatch, SetStateAction } from 'react';

interface AllActivitiesTabProps {
  openDinnerSeriesTab: () => void;
}

const AllActivitiesTab = ({ openDinnerSeriesTab }: AllActivitiesTabProps) => {
  return (
    <>
      <div className="mb-10">
        <div className="bg-navy text-white p-6 rounded-xl mb-8">
          <h3 className="text-2xl font-bold mb-2">Serie de Cenas 2025-2026</h3>
          <p className="mb-4">
            Nuestra serie de cenas recorrerá 24 ciudades por todo México, desde abril 2025 hasta marzo 2026. 
            ¡Una oportunidad única para conectar con los mejores property managers!
          </p>
          <button 
            onClick={openDinnerSeriesTab}
            className="bg-white text-navy px-4 py-2 rounded inline-block hover:bg-gray-100 transition-colors"
          >
            Ver todas las ciudades
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <ActivityCard 
          title="Cenas de Networking"
          description="Cenas para networking y Cotorreo! Organizamos eventos en 24 ciudades con 20-40 asistentes que representan aproximadamente 1,000 propiedades por evento."
          image="lovable-uploads/944c4e44-f0bf-41d6-8f00-9bd40b07af2b.png"
          type="Presencial"
          location="Múltiples ciudades"
          date="Programación 2025-2026"
          url="https://lu.ma/elclub"
        />
        
        <ActivityCard 
          title="Desayunos de Trabajo"
          description="Desayunos de trabajo con un experto destacado (un Property Manager top) para aprender e inspirar. Eventos limitados a 10-20 asistentes para mayor interacción."
          image="lovable-uploads/a2d4fc30-7dc1-48d2-b56d-1597688f999f.png"
          type="Presencial"
          location="Cancún, Playa del Carmen y más"
          date="Programación 2025"
          url="https://lu.ma/desayunos"
        />
        
        <ActivityCard 
          title="Charlas After Check-in"
          description="Un tipo diferente de webinar con líderes de opinión de la industria de renta vacacional para tratar temas específicos: impuestos, optimización, pricing, channel management, etc."
          image="lovable-uploads/9caceabd-d08d-4c0f-a7ae-667dda588eaf.png"
          type="Online"
          location="Virtual"
          date="Programación 2025"
          url="https://lu.ma/charlas"
        />
        
        <ActivityCard 
          title="Compras Colectivas"
          description="Aprovechando nuestra comunidad de 550 anfitriones que administran 6,000 propiedades, organizamos compras colectivas para aumentar el valor entregado para todas las partes involucradas."
          image="lovable-uploads/a2c7e34b-612f-4fec-be68-2066ea3ed943.png"
          type="Iniciativa"
          location="Nacional"
          date="Todo el año"
          url="https://lu.ma/elclub"
        />
      </div>
    </>
  );
};

export default AllActivitiesTab;
