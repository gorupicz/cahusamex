
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

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
            src="/public/lovable-uploads/4deb150c-8c55-4cd1-baf4-560ce2ee0f9a.png" 
            alt="Club de Renta Vacacional Logo" 
            className="h-14"
          />
          <span className="ml-2 text-navy font-heading font-semibold hidden md:block">
            Club de Renta Vacacional
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex space-x-8">
          <Link to="/" className="text-navy hover:text-teal transition-colors font-medium">
            Inicio
          </Link>
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
              to="/" 
              className="text-navy hover:text-teal transition-colors font-medium py-2"
              onClick={() => setIsOpen(false)}
            >
              Inicio
            </Link>
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
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
