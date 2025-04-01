import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Hero from '@/components/Hero';
import TeamMember from '@/components/TeamMember';

const About = () => {
  return (
    <>
      <Navbar />
      <main>
        <Hero 
          title="Quiénes Somos"
          subtitle="Conoce la historia y el propósito del Club de Renta Vacacional"
          backgroundImage="/public/lovable-uploads/27c70ccd-6775-4d50-84e2-e2cd60f72589.png"
        />
        
        <section className="section-container">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-16">
            <div>
              <h2 className="text-navy mb-6">Nuestra Historia</h2>
              <p className="text-gray-600">
                El Club de Renta Vacacional reúne a los mejores Property Managers y Anfitriones de México. 
                Nacimos en la Riviera Maya, el mercado turístico más grande de América Latina, con la visión
                de crear una comunidad colaborativa que impulse el crecimiento y la profesionalización del sector.
              </p>
              <p className="text-gray-600">
                Desde nuestros inicios, hemos estado comprometidos con la creación de espacios para el intercambio 
                de conocimientos, experiencias y recursos que beneficien a todos los integrantes de nuestra comunidad.
              </p>
            </div>
            <div className="rounded-xl overflow-hidden shadow-lg">
              <img 
                src="/public/lovable-uploads/27c70ccd-6775-4d50-84e2-e2cd60f72589.png" 
                alt="Riviera Maya" 
                className="w-full h-auto"
              />
            </div>
          </div>
          
          <div className="bg-navy-light text-white p-8 rounded-xl text-center mb-16">
            <h3 className="text-2xl md:text-3xl font-bold mb-4">NUESTRO PROPÓSITO</h3>
            <p className="text-xl md:text-2xl">
              Apoyar a los Anfitriones a Convertirse en Líderes
            </p>
          </div>
          
          <div className="mb-16">
            <h2 className="text-navy mb-6 text-center">Lo Que Hacemos</h2>
            <p className="text-gray-600 text-center max-w-3xl mx-auto mb-8">
              Organizamos cenas para networking, workshops para aprender e inspirar, charlas online, 
              y compras colectivas, entre otras iniciativas.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
                <h3 className="text-xl font-bold text-navy mb-4">Comunidad de WhatsApp</h3>
                <p className="text-gray-600 mb-4">
                  Nuestra comunidad cuenta con 550 miembros que administran más de 6,000 propiedades 
                  (representando el 3% del mercado mexicano).
                </p>
                <ul className="list-disc pl-5 text-gray-600 space-y-2">
                  <li>Grupos curados para anfitriones por ciudad</li>
                  <li>Grupos curados para Property Managers por región</li>
                  <li>El grupo VIP Club para los Top-50 Property Managers</li>
                  <li>Todos los grupos son gratuitos para permitir un compromiso genuino</li>
                </ul>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
                <h3 className="text-xl font-bold text-navy mb-4">Iniciativas y Actividades</h3>
                <p className="text-gray-600 mb-4">
                  Desarrollamos diversas actividades para fortalecer nuestra comunidad:
                </p>
                <ul className="list-disc pl-5 text-gray-600 space-y-2">
                  <li>Cenas de networking en 24 ciudades</li>
                  <li>Workshops presenciales con expertos del sector</li>
                  <li>Charlas online con líderes de opinión</li>
                  <li>Compras colectivas para obtener mejores condiciones</li>
                  <li>Colaboraciones entre miembros de la comunidad</li>
                </ul>
              </div>
            </div>
          </div>
          
        <div>
          <h2 className="text-navy mb-6 text-center">Nuestros Fundadores</h2>
          <p className="text-gray-600 text-center max-w-3xl mx-auto mb-8">
            Nuestros Miembros Fundadores tienen la misión de liderar la industria de Renta Vacacional en México
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <TeamMember 
              name="Esteban Gorupicz" 
              title="Fundador en Bolsa de Casas MX"
              image="/public/lovable-uploads/62baccbb-2b06-41a9-94ef-25000732b6cf.png"
              linkedIn="https://www.linkedin.com/in/gorupicz/"
            />
            <TeamMember 
              name="Daniel García" 
              title="Fundador en Mi Casa Es Tu Casa"
              image="/public/lovable-uploads/c2c3d78d-0003-4eb3-ab66-fcf7d91313bb.png"
              linkedIn="https://www.linkedin.com/in/daniel-garc%C3%ADa-16770b38/"
            />
            <TeamMember 
              name="Juan Pablo Tellez" 
              title="Fundador en Podcast MundoBNB"
              linkedIn="https://www.linkedin.com/in/jptellezg/"
            />
          </div>
          
          <div className="mt-12 bg-sand-light p-6 rounded-xl">
            <p className="text-center text-navy text-lg font-medium italic">
              "Nuestros Miembros Fundadores están en una misión para liderar la industria de Renta Vacacional en México."
            </p>
          </div>
        </div>
        </section>
      </main>
      <Footer />
    </>
  );
};

export default About;
