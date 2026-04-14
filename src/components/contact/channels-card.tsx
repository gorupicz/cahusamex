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
          href={siteConfig.events.luma}
          target="_blank"
          rel="noopener noreferrer"
          className="block bg-white/10 hover:bg-white/20 transition-colors p-3 rounded-md"
        >
          Actividades en línea y presenciales
        </a>
        <a
          href={siteConfig.whatsapp.channel}
          target="_blank"
          rel="noopener noreferrer"
          className="block bg-white/10 hover:bg-white/20 transition-colors p-3 rounded-md"
        >
          Canal de Anuncios
        </a>
        <a
          href={siteConfig.whatsapp.bolsadereservas}
          target="_blank"
          rel="noopener noreferrer"
          className="block bg-white/10 hover:bg-white/20 transition-colors p-3 rounded-md"
        >
          Bolsa de Reservas
        </a>
      </div>
    </div>
  );
};

export default ChannelsCard;
