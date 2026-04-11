'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X, Instagram, Linkedin } from 'lucide-react';
import { navigationLinks } from '@/data/navigation';
import { siteConfig } from '@/data/site-config';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-white shadow-md py-4 sticky top-0 z-50">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <Link href="/" className="flex items-center">
          <img
            src={siteConfig.logo}
            alt={`${siteConfig.name} Logo`}
            className="h-14"
          />
          <span className="ml-2 text-navy font-heading font-semibold hidden md:block">
            {siteConfig.name}
          </span>
        </Link>

        <div className="hidden md:flex items-center">
          <div className="flex space-x-8 mr-6">
            {navigationLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-navy hover:text-teal transition-colors font-medium"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex space-x-4">
            <a href={siteConfig.social.instagram.url} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="text-navy hover:text-teal transition-colors">
              <Instagram size={20} />
            </a>
            <a href={siteConfig.social.linkedin.url} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="text-navy hover:text-teal transition-colors">
              <Linkedin size={20} />
            </a>
          </div>
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden text-navy focus:outline-none"
          aria-label="Toggle menu"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {isOpen && (
        <div className="md:hidden bg-white pt-2 pb-4 px-4">
          <div className="flex flex-col space-y-3">
            {navigationLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-navy hover:text-teal transition-colors font-medium py-2"
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="flex space-x-4 pt-2">
              <a href={siteConfig.social.instagram.url} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="text-navy hover:text-teal transition-colors">
                <Instagram size={20} />
              </a>
              <a href={siteConfig.social.linkedin.url} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="text-navy hover:text-teal transition-colors">
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
