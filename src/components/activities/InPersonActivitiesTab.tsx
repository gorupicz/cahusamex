
import ActivityCard from '@/components/ActivityCard';

const InPersonActivitiesTab = () => {
  return (
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
        title="Cenas en la Riviera Maya"
        description="Eventos de networking en un ambiente relajado para conectar con otros profesionales del sector y compartir experiencias y oportunidades."
        image="lovable-uploads/d5231b7b-dcfd-4ed8-ae93-69197b4a2bad.png"
        type="Presencial"
        location="Playa del Carmen"
        date="Mensual"
        url="https://lu.ma/elclub"
      />
      
      <ActivityCard 
        title="Encuentros en CDMX"
        description="Reuniones en la capital para conectar con anfitriones y administradores de propiedades de todo el país que visitan la ciudad."
        image="lovable-uploads/9ae40046-2d5c-4b5f-bf59-fe77e190ca98.png"
        type="Presencial"
        location="Ciudad de México"
        date="Bimestral"
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
    </div>
  );
};

export default InPersonActivitiesTab;
