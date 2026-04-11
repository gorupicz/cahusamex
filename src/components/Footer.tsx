import Link from 'next/link';
import { Instagram, Linkedin, Mail, MessageSquare } from 'lucide-react';
import { navigationLinks } from '@/data/navigation';
import { siteConfig } from '@/data/site-config';

const Footer = () => {
  return (
    <footer className="bg-navy text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex flex-col">
            <div className="flex items-center mb-4">
              <img
                src={siteConfig.logo}
                alt={`${siteConfig.name} Logo`}
                className="h-20 bg-white rounded-full p-1"
              />
              <h3 className="ml-3 text-lg font-heading font-medium">{siteConfig.name}</h3>
            </div>
            <p className="my-2 text-gray-300">
              Reuniendo a los mejores Property Managers y Anfitriones de Renta Vacacional en México
            </p>
          </div>

          <div>
            <h4 className="text-xl font-heading font-medium mb-4">Enlaces</h4>
            <ul className="space-y-2">
              {navigationLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-gray-300 hover:text-teal-light transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xl font-heading font-medium mb-4">Contáctanos</h4>
            <div className="flex space-x-4 mb-4">
              <a href={siteConfig.social.instagram.url} target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <Instagram className="h-6 w-6 text-gray-300 hover:text-teal-light transition-colors" />
              </a>
              <a href={siteConfig.social.linkedin.url} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                <Linkedin className="h-6 w-6 text-gray-300 hover:text-teal-light transition-colors" />
              </a>
              <a href={siteConfig.social.whatsapp.communityUrl} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp Community">
                <MessageSquare className="h-6 w-6 text-gray-300 hover:text-teal-light transition-colors" />
              </a>
              <a href={`mailto:${siteConfig.email}`} aria-label="Email">
                <Mail className="h-6 w-6 text-gray-300 hover:text-teal-light transition-colors" />
              </a>
            </div>
            <p className="text-gray-300">{siteConfig.email}</p>
            <p className="text-gray-300 mt-4">{siteConfig.location}</p>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; {new Date().getFullYear()} {siteConfig.name}. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
