import { siteConfig } from '@/data/site-config';

const ChannelsCard = () => {
  return (
    <div className="bg-navy-light text-white p-6 rounded-lg">
      <h3 className="text-xl font-bold mb-4">Nuestros Canales</h3>
      <p className="mb-4">
        Sigue nuestra programación de eventos y actividades a través de nuestros canales oficiales:
      </p>
      <div className="space-y-2">
        <a
          href={siteConfig.events.dinners}
          target="_blank"
          rel="noopener noreferrer"
          className="block bg-white/10 hover:bg-white/20 transition-colors p-3 rounded-md"
        >
          Cenas de Networking: lu.ma/rentasvacacionales
        </a>
        <a
          href={siteConfig.events.breakfasts}
          target="_blank"
          rel="noopener noreferrer"
          className="block bg-white/10 hover:bg-white/20 transition-colors p-3 rounded-md"
        >
          Desayunos de Trabajo: lu.ma/rentasvacacionales
        </a>
        <a
          href={siteConfig.events.talks}
          target="_blank"
          rel="noopener noreferrer"
          className="block bg-white/10 hover:bg-white/20 transition-colors p-3 rounded-md"
        >
          Charlas After Check-in: lu.ma/rentasvacacionales
        </a>
      </div>
    </div>
  );
};

export default ChannelsCard;
