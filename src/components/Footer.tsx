
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Linkedin, Mail, MessageSquare } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-navy text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex flex-col">
            <div className="flex items-center mb-4">
              <img 
                src="/lovable-uploads/4deb150c-8c55-4cd1-baf4-560ce2ee0f9a.png" 
                alt="Club de Renta Vacacional Logo" 
                className="h-20 bg-white rounded-full p-1"
              />
              <h3 className="ml-3 text-lg font-heading font-medium">Club de Renta Vacacional</h3>
            </div>
            <p className="my-2 text-gray-300">
              Reuniendo a los mejores Property Managers y Anfitriones de Renta Vacacional en México
            </p>
          </div>

          <div>
            <h4 className="text-xl font-heading font-medium mb-4">Enlaces</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/about" className="text-gray-300 hover:text-teal-light transition-colors">
                  Quiénes Somos
                </Link>
              </li>
              <li>
                <Link to="/activities" className="text-gray-300 hover:text-teal-light transition-colors">
                  Actividades
                </Link>
              </li>
              <li>
                <Link to="/community" className="text-gray-300 hover:text-teal-light transition-colors">
                  Comunidad
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-300 hover:text-teal-light transition-colors">
                  Contacto
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xl font-heading font-medium mb-4">Contáctanos</h4>
            <div className="flex space-x-4 mb-4">
              <a href="https://www.instagram.com/clubrenta_vacacional/" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <Instagram className="h-6 w-6 text-gray-300 hover:text-teal-light transition-colors" />
              </a>
              <a href="https://www.linkedin.com/company/club-de-renta-vacacional" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                <Linkedin className="h-6 w-6 text-gray-300 hover:text-teal-light transition-colors" />
              </a>
              <a href="https://chat.whatsapp.com/JWT0uzy8k5V4auRfWE40T1" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp Community">
                <MessageSquare className="h-6 w-6 text-gray-300 hover:text-teal-light transition-colors" />
              </a>
              <a href="mailto:info@clubrenta.mx" aria-label="Email">
                <Mail className="h-6 w-6 text-gray-300 hover:text-teal-light transition-colors" />
              </a>
            </div>
            <p className="text-gray-300">info@clubrenta.mx</p>
            <p className="text-gray-300 mt-4">Riviera Maya, México</p>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; {new Date().getFullYear()} Club de Renta Vacacional. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
