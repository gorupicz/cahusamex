import { Mail, MapPin, Phone, Instagram, Linkedin, MessageSquare } from 'lucide-react';
import { siteConfig } from '@/data/site-config';

const ContactInfo = () => {
  return (
    <div>
      <h2 className="text-navy mb-6">Estamos Cerca</h2>
      <p className="text-gray-600 mb-8">
        Queremos conocerte y ayudarte a crecer en la industria de renta vacacional.
        No dudes en ponerte en contacto con nosotros para cualquier consulta, sugerencia o para formar parte de nuestra comunidad.
      </p>

      <div className="space-y-6 mb-8">
        <div className="flex items-start">
          <div className="h-10 w-10 bg-teal-light rounded-full flex items-center justify-center mr-4">
            <Mail className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-navy mb-1">Correo Electrónico</h3>
            <p className="text-gray-600">{siteConfig.email}</p>
          </div>
        </div>

        <div className="flex items-start">
          <div className="h-10 w-10 bg-teal-light rounded-full flex items-center justify-center mr-4">
            <MapPin className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-navy mb-1">Ubicación</h3>
            <p className="text-gray-600">{siteConfig.location}</p>
          </div>
        </div>

        <div className="flex items-start">
          <div className="h-10 w-10 bg-teal-light rounded-full flex items-center justify-center mr-4">
            <MessageSquare className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-navy mb-1">Comunidad WhatsApp</h3>
            <a href={siteConfig.social.whatsapp.communityUrl} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-teal transition-colors">
              Unirse al grupo de la comunidad
            </a>
          </div>
        </div>

        <div className="flex items-start">
          <div className="h-10 w-10 bg-teal-light rounded-full flex items-center justify-center mr-4">
            <Phone className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-navy mb-1">WhatsApp</h3>
            <p className="text-gray-600">Solicita el enlace a nuestros grupos a través del formulario</p>
          </div>
        </div>

        <div className="flex items-start">
          <div className="h-10 w-10 bg-teal-light rounded-full flex items-center justify-center mr-4">
            <Instagram className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-navy mb-1">Instagram</h3>
            <a href={siteConfig.social.instagram.url} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-teal transition-colors">
              {siteConfig.social.instagram.handle}
            </a>
          </div>
        </div>

        <div className="flex items-start">
          <div className="h-10 w-10 bg-teal-light rounded-full flex items-center justify-center mr-4">
            <Linkedin className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-navy mb-1">LinkedIn</h3>
            <a href={siteConfig.social.linkedin.url} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-teal transition-colors">
              {siteConfig.name}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactInfo;
