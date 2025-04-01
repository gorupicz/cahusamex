
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Hero from '@/components/Hero';
import ContactForm from '@/components/ContactForm';
import { Mail, MapPin, Phone } from 'lucide-react';

const Contact = () => {
  return (
    <>
      <Navbar />
      <main>
        <Hero 
          title="Contáctanos"
          subtitle="¿Tienes preguntas o quieres formar parte de nuestra comunidad? ¡Estamos aquí para ayudarte!"
          backgroundImage="/public/lovable-uploads/17417649-66f8-462e-8d40-f554ede6af35.png"
        />
        
        <section className="section-container">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
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
                    <p className="text-gray-600">info@clubderentavacacional.mx</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="h-10 w-10 bg-teal-light rounded-full flex items-center justify-center mr-4">
                    <MapPin className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-navy mb-1">Ubicación</h3>
                    <p className="text-gray-600">Riviera Maya, México</p>
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
              </div>
              
              <div className="bg-navy-light text-white p-6 rounded-lg">
                <h3 className="text-xl font-bold mb-4">Nuestros Canales</h3>
                <p className="mb-4">
                  Sigue nuestra programación de eventos y actividades a través de nuestros canales oficiales:
                </p>
                <div className="space-y-2">
                  <a 
                    href="https://lu.ma/elclub" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="block bg-white/10 hover:bg-white/20 transition-colors p-3 rounded-md"
                  >
                    Cenas de Networking: lu.ma/elclub
                  </a>
                  <a 
                    href="https://lu.ma/desayunos" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="block bg-white/10 hover:bg-white/20 transition-colors p-3 rounded-md"
                  >
                    Desayunos de Trabajo: lu.ma/desayunos
                  </a>
                  <a 
                    href="https://lu.ma/charlas" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="block bg-white/10 hover:bg-white/20 transition-colors p-3 rounded-md"
                  >
                    Charlas After Check-in: lu.ma/charlas
                  </a>
                </div>
              </div>
            </div>
            
            <ContactForm />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
};

export default Contact;
