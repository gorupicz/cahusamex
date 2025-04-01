
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Hero from '@/components/Hero';
import CommunityGroup from '@/components/CommunityGroup';
import { Users, MessageSquare, Star } from 'lucide-react';

const Community = () => {
  return (
    <>
      <Navbar />
      <main>
        <Hero 
          title="Nuestra Comunidad"
          subtitle="Forma parte de la comunidad de anfitriones y Property Managers más grande de México"
          backgroundImage="/public/lovable-uploads/a2c7e34b-612f-4fec-be68-2066ea3ed943.png"
        />
        
        <section className="section-container">
          <div className="bg-navy-light text-white p-8 rounded-xl text-center mb-16">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-5xl font-bold text-teal-light mb-2">550+</p>
                <p className="text-xl">Miembros Activos</p>
              </div>
              <div>
                <p className="text-5xl font-bold text-teal-light mb-2">6,000+</p>
                <p className="text-xl">Propiedades Administradas</p>
              </div>
              <div>
                <p className="text-5xl font-bold text-teal-light mb-2">3%</p>
                <p className="text-xl">Del Mercado Mexicano</p>
              </div>
            </div>
          </div>
          
          <div className="mb-16">
            <h2 className="text-navy mb-6 text-center">Comunidad WhatsApp</h2>
            <p className="text-gray-600 text-center max-w-3xl mx-auto mb-8">
              Todos nuestros grupos son gratuitos para permitir un compromiso genuino entre los miembros
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <CommunityGroup 
                title="Grupos por Ciudad"
                description="Grupos curados para anfitriones organizados por ciudad, permitiendo conexiones locales y compartir información relevante para cada mercado."
                members={350}
                icon="city"
              />
              
              <CommunityGroup 
                title="Grupos Regionales"
                description="Grupos curados para Property Managers organizados por región, facilitando la colaboración y el intercambio de recursos a nivel regional."
                members={150}
                icon="map"
              />
              
              <CommunityGroup 
                title="VIP Club"
                description="Grupo exclusivo para los Top-50 Property Managers de México, donde se comparten estrategias avanzadas y oportunidades de negocio."
                members={50}
                icon="star"
              />
            </div>
          </div>
          
          <div className="mb-16">
            <h2 className="text-navy mb-6 text-center">Beneficios de la Comunidad</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
                <div className="flex items-start mb-4">
                  <div className="h-12 w-12 bg-teal-light rounded-lg flex items-center justify-center mr-4">
                    <MessageSquare className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-navy">Intercambio de Conocimientos</h3>
                  </div>
                </div>
                <p className="text-gray-600 mb-4">
                  Acceso a información valiosa y conocimientos compartidos por profesionales experimentados en la industria.
                </p>
                <ul className="list-disc pl-5 text-gray-600 space-y-2">
                  <li>Resolución de dudas y problemas comunes</li>
                  <li>Compartir mejores prácticas de la industria</li>
                  <li>Acceso a recursos educativos exclusivos</li>
                  <li>Discusiones sobre tendencias del mercado</li>
                </ul>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
                <div className="flex items-start mb-4">
                  <div className="h-12 w-12 bg-teal-light rounded-lg flex items-center justify-center mr-4">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-navy">Networking Profesional</h3>
                  </div>
                </div>
                <p className="text-gray-600 mb-4">
                  Oportunidades para conectar con otros profesionales del sector y expandir tu red de contactos.
                </p>
                <ul className="list-disc pl-5 text-gray-600 space-y-2">
                  <li>Contactos con proveedores confiables</li>
                  <li>Alianzas estratégicas entre miembros</li>
                  <li>Recomendaciones y referencias de clientes</li>
                  <li>Colaboraciones para proyectos especiales</li>
                </ul>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
                <div className="flex items-start mb-4">
                  <div className="h-12 w-12 bg-teal-light rounded-lg flex items-center justify-center mr-4">
                    <Star className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-navy">Desarrollo Profesional</h3>
                  </div>
                </div>
                <p className="text-gray-600 mb-4">
                  Recursos y oportunidades para el crecimiento profesional y el desarrollo de habilidades.
                </p>
                <ul className="list-disc pl-5 text-gray-600 space-y-2">
                  <li>Invitaciones a eventos y actividades exclusivas</li>
                  <li>Acceso prioritario a workshops y charlas</li>
                  <li>Oportunidades de mentoría con líderes del sector</li>
                  <li>Reconocimiento dentro de la industria</li>
                </ul>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
                <div className="flex items-start mb-4">
                  <div className="h-12 w-12 bg-teal-light rounded-lg flex items-center justify-center mr-4">
                    <ShoppingBag className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-navy">Beneficios Comerciales</h3>
                  </div>
                </div>
                <p className="text-gray-600 mb-4">
                  Ventajas económicas y comerciales por ser parte de nuestra comunidad.
                </p>
                <ul className="list-disc pl-5 text-gray-600 space-y-2">
                  <li>Participación en compras colectivas</li>
                  <li>Descuentos especiales con proveedores aliados</li>
                  <li>Acceso a servicios profesionales con tarifas preferenciales</li>
                  <li>Oportunidades de negocio entre miembros</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="text-center">
            <h2 className="text-navy mb-6">¿Quieres unirte a nuestra comunidad?</h2>
            <p className="text-gray-600 max-w-3xl mx-auto mb-8">
              Si eres Property Manager o Anfitrión y quieres formar parte de la comunidad de renta vacacional más importante de México, contáctanos.
            </p>
            <a href="/contact" className="btn-primary">Contáctanos</a>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
};

export default Community;
