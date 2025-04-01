
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, Instagram, Linkedin } from 'lucide-react';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <nav className="bg-white shadow-md py-4 sticky top-0 z-50">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <Link to="/" className="flex items-center">
          <img 
            src="/lovable-uploads/4deb150c-8c55-4cd1-baf4-560ce2ee0f9a.png" 
            alt="Club de Renta Vacacional Logo" 
            className="h-14"
          />
          <span className="ml-2 text-navy font-heading font-semibold hidden md:block">
            Club de Renta Vacacional
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center">
          <div className="flex space-x-8 mr-6">
            <Link to="/about" className="text-navy hover:text-teal transition-colors font-medium">
              Quiénes Somos
            </Link>
            <Link to="/activities" className="text-navy hover:text-teal transition-colors font-medium">
              Actividades
            </Link>
            <Link to="/community" className="text-navy hover:text-teal transition-colors font-medium">
              Comunidad
            </Link>
            <Link to="/contact" className="text-navy hover:text-teal transition-colors font-medium">
              Contacto
            </Link>
          </div>
          
          <div className="flex space-x-4">
            <a href="https://www.instagram.com/clubrenta_vacacional/" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="text-navy hover:text-teal transition-colors">
              <Instagram size={20} />
            </a>
            <a href="https://www.linkedin.com/company/club-de-renta-vacacional" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="text-navy hover:text-teal transition-colors">
              <Linkedin size={20} />
            </a>
          </div>
        </div>

        {/* Mobile menu button */}
        <button
          onClick={toggleMenu}
          className="md:hidden text-navy focus:outline-none"
          aria-label="Toggle menu"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden bg-white pt-2 pb-4 px-4">
          <div className="flex flex-col space-y-3">
            <Link 
              to="/about" 
              className="text-navy hover:text-teal transition-colors font-medium py-2"
              onClick={() => setIsOpen(false)}
            >
              Quiénes Somos
            </Link>
            <Link 
              to="/activities" 
              className="text-navy hover:text-teal transition-colors font-medium py-2"
              onClick={() => setIsOpen(false)}
            >
              Actividades
            </Link>
            <Link 
              to="/community" 
              className="text-navy hover:text-teal transition-colors font-medium py-2"
              onClick={() => setIsOpen(false)}
            >
              Comunidad
            </Link>
            <Link 
              to="/contact" 
              className="text-navy hover:text-teal transition-colors font-medium py-2"
              onClick={() => setIsOpen(false)}
            >
              Contacto
            </Link>
            
            <div className="flex space-x-4 pt-2">
              <a href="https://www.instagram.com/clubrenta_vacacional/" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="text-navy hover:text-teal transition-colors">
                <Instagram size={20} />
              </a>
              <a href="https://www.linkedin.com/company/club-de-renta-vacacional" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="text-navy hover:text-teal transition-colors">
                <Linkedin size={20} />
              </a>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
