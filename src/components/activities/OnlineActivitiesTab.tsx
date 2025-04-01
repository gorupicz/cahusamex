
import ActivityCard from '@/components/ActivityCard';

const OnlineActivitiesTab = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
        title="Seminarios Web"
        description="Sesiones educativas sobre tendencias del mercado, novedades tecnológicas y aspectos legales relevantes para los Property Managers y anfitriones."
        image="lovable-uploads/40eab1c4-247b-49be-b5f4-085658d5a3af.png"
        type="Online"
        location="Virtual"
        date="Mensual"
        url="https://lu.ma/charlas"
      />
    </div>
  );
};

export default OnlineActivitiesTab;
