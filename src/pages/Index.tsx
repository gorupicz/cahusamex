
import { Link } from 'react-router-dom';
import Hero from '@/components/Hero';
import FeatureCard from '@/components/FeatureCard';
import ActivityCard from '@/components/ActivityCard';
import TeamMember from '@/components/TeamMember';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Users, Calendar, Book, ShoppingBag, MapPin } from 'lucide-react';

const Index = () => {
  return (
    <>
      <Navbar />
      <main>
        <Hero 
          title="Cámara Empresarial de la Hospitalidad USA - México México"
          subtitle="Reuniendo a los mejores Property Managers y Anfitriones de Renta Vacacional en México"
          backgroundImage="/lovable-uploads/27c70ccd-6775-4d50-84e2-e2cd60f72589.png"
          showButton={true}
        />

        {/* About Section */}
        <section className="section-container">
          <div className="text-center mb-12">
            <h2 className="text-navy mb-4">¿Quiénes Somos?</h2>
            <p className="max-w-3xl mx-auto text-lg text-gray-600">
              El Cámara Empresarial de la Hospitalidad USA - México reúne a los mejores Property Managers y Anfitriones de México. 
              Nacimos en la Riviera Maya, el mercado turístico más grande de América Latina.
            </p>
          </div>

          <div className="bg-navy-light text-white p-8 rounded-xl mb-16">
            <h3 className="text-2xl md:text-3xl font-bold text-center mb-4">NUESTRO PROPÓSITO</h3>
            <p className="text-xl md:text-2xl text-center">
              Apoyar a los Anfitriones a Convertirse en Líderes
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              title="Networking"
              description="Organizamos cenas para networking y eventos que conectan a los profesionales de la industria."
              icon={Users}
            />
            <FeatureCard 
              title="Aprendizaje"
              description="Workshops para aprender e inspirar con expertos en el mercado de renta vacacional."
              icon={Book}
            />
            <FeatureCard 
              title="Comunidad"
              description="Grupos de WhatsApp para anfitriones por ciudad y Property Managers por región."
              icon={Calendar}
            />
          </div>

          <div className="mt-12 text-center">
            <Link to="/about" className="btn-outline">
              Conoce más sobre nosotros
            </Link>
          </div>
        </section>

        {/* Dinner Series 2025-2026 Highlight */}
        <section className="bg-navy text-white py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Serie de Cenas 2025-2026</h2>
              <p className="max-w-3xl mx-auto text-lg">
                24 experiencias culinarias únicas en las principales ciudades de México
              </p>
            </div>
            
            <div className="bg-white/10 rounded-xl p-6 md:p-8 mb-8">
              <div className="flex flex-col md:flex-row items-center justify-between">
                <div className="mb-6 md:mb-0 md:mr-8">
                  <h3 className="text-2xl font-bold mb-4">Conecta con los mejores Property Managers</h3>
                  <p className="mb-4">
                    De abril 2025 a marzo 2026, organizamos cenas exclusivas en 24 ciudades de México para crear conexiones valiosas en un ambiente relajado.
                  </p>
                  <div className="mb-4">
                    <div className="flex items-center mb-2">
                      <MapPin className="h-5 w-5 mr-2 text-teal-light" />
                      <span>121,500 propiedades representadas en estas ciudades</span>
                    </div>
                    <div className="flex items-center mb-2">
                      <Users className="h-5 w-5 mr-2 text-teal-light" />
                      <span>Managers de aproximadamente 10% del mercado</span>
                    </div>
                    <div className="flex items-center">
                      <ShoppingBag className="h-5 w-5 mr-2 text-teal-light" />
                      <span>Solo 3 espacios de patrocinio disponibles por cena</span>
                    </div>
                  </div>
                </div>
                <div className="w-full md:w-1/3">
                  <img 
                    src="/lovable-uploads/944c4e44-f0bf-41d6-8f00-9bd40b07af2b.png" 
                    alt="Cenas de Networking" 
                    className="rounded-lg w-full h-auto shadow-lg"
                  />
                </div>
              </div>
            </div>
            
            <div className="text-center">
              <Link to="/activities#dinner-series" className="bg-white text-navy px-8 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors inline-block">
                Ver todas las ciudades
              </Link>
            </div>
          </div>
        </section>
        
        {/* Activities Preview */}
        <section className="bg-sand-light py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-navy mb-4">Nuestras Actividades 2025</h2>
              <p className="max-w-3xl mx-auto text-lg text-gray-600">
                Organizamos eventos presenciales y virtuales para fortalecer nuestra comunidad
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <ActivityCard 
                title="Cenas de Networking"
                description="Cenas para networking y Cotorreo en 24 ciudades con 20-40 asistentes por evento."
                image="/lovable-uploads/944c4e44-f0bf-41d6-8f00-9bd40b07af2b.png"
                type="Presencial"
                location="Múltiples ciudades"
                url="https://lu.ma/elclub"
              />
              
              <ActivityCard 
                title="Desayunos de Trabajo"
                description="Desayunos con expertos destacados para aprender e inspirar en formato reducido."
                image="/lovable-uploads/a2d4fc30-7dc1-48d2-b56d-1597688f999f.png"
                type="Presencial"
                location="Cancún, Playa del Carmen y más"
                url="https://lu.ma/desayunos"
              />
              
              <ActivityCard 
                title="Charlas After Check-in"
                description="Webinars con líderes de opinión sobre temas específicos: impuestos, optimización, pricing, etc."
                image="/lovable-uploads/9caceabd-d08d-4c0f-a7ae-667dda588eaf.png"
                type="Virtual"
                location="Online"
                url="https://lu.ma/charlas"
              />
            </div>

            <div className="mt-12 text-center">
              <Link to="/activities" className="btn-primary">
                Ver todas las actividades
              </Link>
            </div>
          </div>
        </section>
        
        {/* Community Stats */}
        <section className="section-container">
          <div className="bg-white rounded-xl shadow-md p-8 md:p-12 mb-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div>
                <p className="text-5xl font-bold text-teal mb-2">550+</p>
                <p className="text-xl text-navy">Miembros</p>
              </div>
              <div>
                <p className="text-5xl font-bold text-teal mb-2">6,000+</p>
                <p className="text-xl text-navy">Propiedades</p>
              </div>
              <div>
                <p className="text-5xl font-bold text-teal mb-2">3%</p>
                <p className="text-xl text-navy">Del Mercado Mexicano</p>
              </div>
            </div>
          </div>
          
          <div className="text-center mb-12">
            <h2 className="text-navy mb-4">Miembros Fundadores</h2>
            <p className="max-w-3xl mx-auto text-lg text-gray-600">
              Nuestros Miembros Fundadores tienen la misión de liderar la industria de Renta Vacacional en México
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <TeamMember 
              name="Esteban Gorupicz" 
              title="Fundador en Bolsa de Casas MX"
              image="/lovable-uploads/62baccbb-2b06-41a9-94ef-25000732b6cf.png"
              linkedIn="https://www.linkedin.com/in/gorupicz/"
            />
            <TeamMember 
              name="Daniel García" 
              title="Fundador en Mi Casa Es Tu Casa"
              image="/lovable-uploads/c2c3d78d-0003-4eb3-ab66-fcf7d91313bb.png"
              linkedIn="https://www.linkedin.com/in/daniel-garc%C3%ADa-16770b38/"
            />
            <TeamMember 
              name="Juan Pablo Tellez" 
              title="Fundador en Podcast MundoBNB"
              image="/lovable-uploads/737ea7d2-1447-49a6-85e5-65fafce1de9d.png"
              linkedIn="https://www.linkedin.com/in/jptellezg/"
            />
          </div>
        </section>

        {/* Call to Action */}
        <section className="bg-teal text-white py-16">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">¿Eres Property Manager o Anfitrión?</h2>
            <p className="text-xl max-w-3xl mx-auto mb-8">
              Únete a nuestra comunidad y conecta con los mejores profesionales de la industria en México
            </p>
            <Link to="/contact" className="bg-white text-teal px-8 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors">
              Contáctanos
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
};

export default Index;
