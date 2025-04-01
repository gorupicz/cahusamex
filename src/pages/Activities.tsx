
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Hero from '@/components/Hero';
import ActivityCard from '@/components/ActivityCard';
import DinnerSeriesTable from '@/components/DinnerSeriesTable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShoppingBag } from 'lucide-react';
import { useState } from 'react';

const Activities = () => {
  const [activeTab, setActiveTab] = useState("all");

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  const openDinnerSeriesTab = () => {
    setActiveTab("dinner-series");
  };

  return (
    <>
      <Navbar />
      <main>
        <Hero 
          title="Nuestras Actividades"
          subtitle="Conoce todos los eventos y actividades que organizamos para nuestra comunidad"
          backgroundImage="lovable-uploads/86e6085a-49e5-4b3c-9d4a-aa679c0ac61c.png"
        />
        
        <section className="section-container">
          <Tabs value={activeTab} onValueChange={handleTabChange} defaultValue="all" className="w-full">
            <div className="flex justify-center mb-8">
              <TabsList className="bg-sand-light">
                <TabsTrigger value="all">Todas</TabsTrigger>
                <TabsTrigger value="dinner-series">Cenas 2025-2026</TabsTrigger>
                <TabsTrigger value="in-person">Presenciales</TabsTrigger>
                <TabsTrigger value="online">Online</TabsTrigger>
                <TabsTrigger value="purchases">Compras Colectivas</TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="all">
              <div className="mb-10">
                <div className="bg-navy text-white p-6 rounded-xl mb-8">
                  <h3 className="text-2xl font-bold mb-2">Serie de Cenas 2025-2026</h3>
                  <p className="mb-4">
                    Nuestra serie de cenas recorrerá 24 ciudades por todo México, desde abril 2025 hasta marzo 2026. 
                    ¡Una oportunidad única para conectar con los mejores property managers!
                  </p>
                  <button 
                    onClick={openDinnerSeriesTab}
                    className="bg-white text-navy px-4 py-2 rounded inline-block hover:bg-gray-100 transition-colors"
                  >
                    Ver todas las ciudades
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <ActivityCard 
                  title="Cenas de Networking"
                  description="Cenas para networking y Cotorreo! Organizamos eventos en 24 ciudades con 20-40 asistentes que representan aproximadamente 1,000 propiedades por evento."
                  image="lovable-uploads/944c4e44-f0bf-41d6-8f00-9bd40b07af2b.png"
                  type="Presencial"
                  location="Múltiples ciudades"
                  date="Programación 2025-2026"
                  url="https://lu.ma/elclub"
                />
                
                <ActivityCard 
                  title="Desayunos de Trabajo"
                  description="Desayunos de trabajo con un experto destacado (un Property Manager top) para aprender e inspirar. Eventos limitados a 10-20 asistentes para mayor interacción."
                  image="lovable-uploads/a2d4fc30-7dc1-48d2-b56d-1597688f999f.png"
                  type="Presencial"
                  location="Cancún, Playa del Carmen y más"
                  date="Programación 2025"
                  url="https://lu.ma/desayunos"
                />
                
                <ActivityCard 
                  title="Charlas After Check-in"
                  description="Un tipo diferente de webinar con líderes de opinión de la industria de renta vacacional para tratar temas específicos: impuestos, optimización, pricing, channel management, etc."
                  image="lovable-uploads/9caceabd-d08d-4c0f-a7ae-667dda588eaf.png"
                  type="Online"
                  location="Virtual"
                  date="Programación 2025"
                  url="https://lu.ma/charlas"
                />
                
                <ActivityCard 
                  title="Compras Colectivas"
                  description="Aprovechando nuestra comunidad de 550 anfitriones que administran 6,000 propiedades, organizamos compras colectivas para aumentar el valor entregado para todas las partes involucradas."
                  image="lovable-uploads/a2c7e34b-612f-4fec-be68-2066ea3ed943.png"
                  type="Iniciativa"
                  location="Nacional"
                  date="Todo el año"
                  url="https://lu.ma/elclub"
                />
              </div>
            </TabsContent>
            
            <TabsContent value="dinner-series" id="dinner-series">
              <DinnerSeriesTable />
              
              <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                  <img 
                    src="lovable-uploads/944c4e44-f0bf-41d6-8f00-9bd40b07af2b.png" 
                    alt="Cenas de Networking" 
                    className="w-full h-64 object-cover"
                  />
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-navy mb-2">Experiencia Culinaria Única</h3>
                    <p className="text-gray-600">
                      Nuestras cenas son experiencias culinarias seleccionadas y oportunidades para conectar con los principales property managers en un ambiente muy relajado, donde las conversaciones fluyen naturalmente.
                    </p>
                  </div>
                </div>
                
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                  <img 
                    src="lovable-uploads/d5231b7b-dcfd-4ed8-ae93-69197b4a2bad.png" 
                    alt="Property Managers" 
                    className="w-full h-64 object-cover"
                  />
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-navy mb-2">Conexiones Valiosas</h3>
                    <p className="text-gray-600">
                      Según AirDNA, estas 24 ciudades representan 121,500 propiedades en plataformas de renta vacacional. Esperamos tener a los administradores del 10% de estas propiedades participando en nuestros eventos.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="mt-10 text-center">
                <a 
                  href="https://lu.ma/elclub" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="btn-primary inline-block"
                >
                  Regístrate para las próximas cenas
                </a>
              </div>
            </TabsContent>
            
            <TabsContent value="in-person">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <ActivityCard 
                  title="Cenas de Networking"
                  description="Cenas para networking y Cotorreo! Organizamos eventos en 24 ciudades con 20-40 asistentes que representan aproximadamente 1,000 propiedades por evento."
                  image="lovable-uploads/944c4e44-f0bf-41d6-8f00-9bd40b07af2b.png"
                  type="Presencial"
                  location="Múltiples ciudades"
                  date="Programación 2025-2026"
                  url="https://lu.ma/elclub"
                />
                
                <ActivityCard 
                  title="Cenas en la Riviera Maya"
                  description="Eventos de networking en un ambiente relajado para conectar con otros profesionales del sector y compartir experiencias y oportunidades."
                  image="lovable-uploads/d5231b7b-dcfd-4ed8-ae93-69197b4a2bad.png"
                  type="Presencial"
                  location="Playa del Carmen"
                  date="Mensual"
                  url="https://lu.ma/elclub"
                />
                
                <ActivityCard 
                  title="Encuentros en CDMX"
                  description="Reuniones en la capital para conectar con anfitriones y administradores de propiedades de todo el país que visitan la ciudad."
                  image="lovable-uploads/9ae40046-2d5c-4b5f-bf59-fe77e190ca98.png"
                  type="Presencial"
                  location="Ciudad de México"
                  date="Bimestral"
                  url="https://lu.ma/elclub"
                />
                
                <ActivityCard 
                  title="Desayunos de Trabajo"
                  description="Desayunos de trabajo con un experto destacado (un Property Manager top) para aprender e inspirar. Eventos limitados a 10-20 asistentes para mayor interacción."
                  image="lovable-uploads/a2d4fc30-7dc1-48d2-b56d-1597688f999f.png"
                  type="Presencial"
                  location="Cancún, Playa del Carmen y más"
                  date="Programación 2025"
                  url="https://lu.ma/desayunos"
                />
              </div>
            </TabsContent>
            
            <TabsContent value="online">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <ActivityCard 
                  title="Charlas After Check-in"
                  description="Un tipo diferente de webinar con líderes de opinión de la industria de renta vacacional para tratar temas específicos: impuestos, optimización, pricing, channel management, etc."
                  image="lovable-uploads/9caceabd-d08d-4c0f-a7ae-667dda588eaf.png"
                  type="Online"
                  location="Virtual"
                  date="Programación 2025"
                  url="https://lu.ma/charlas"
                />
                
                <ActivityCard 
                  title="Seminarios Web"
                  description="Sesiones educativas sobre tendencias del mercado, novedades tecnológicas y aspectos legales relevantes para los Property Managers y anfitriones."
                  image="lovable-uploads/40eab1c4-247b-49be-b5f4-085658d5a3af.png"
                  type="Online"
                  location="Virtual"
                  date="Mensual"
                  url="https://lu.ma/charlas"
                />
              </div>
            </TabsContent>
            
            <TabsContent value="purchases">
              <div>
                <div className="bg-white p-8 rounded-xl shadow-md mb-8">
                  <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                    <div className="h-20 w-20 bg-teal-light rounded-full flex items-center justify-center">
                      <ShoppingBag className="h-10 w-10 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-navy mb-2">Compras Colectivas</h3>
                      <p className="text-gray-600">
                        Aprovechando nuestra comunidad de 550 anfitriones que administran 6,000 propiedades, organizamos compras colectivas. El beneficio es aumentar el valor entregado para todas las partes involucradas. Buscamos acuerdos Win-Win, no solo descuentos al por mayor.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  <ActivityCard 
                    title="Insumos de Limpieza"
                    description="Compras colectivas de productos de limpieza de alta calidad a precios especiales para miembros de nuestra comunidad."
                    image="lovable-uploads/a2c7e34b-612f-4fec-be68-2066ea3ed943.png"
                    type="Compra Colectiva"
                    location="Nacional"
                    date="Trimestral"
                    url="https://lu.ma/elclub"
                  />
                  
                  <ActivityCard 
                    title="Amenidades"
                    description="Amenidades personalizadas con el branding de cada Property Manager a precios competitivos gracias al volumen de compra."
                    image="lovable-uploads/a2c7e34b-612f-4fec-be68-2066ea3ed943.png"
                    type="Compra Colectiva"
                    location="Nacional"
                    date="Bimestral"
                    url="https://lu.ma/elclub"
                  />
                  
                  <ActivityCard 
                    title="Servicios Tecnológicos"
                    description="Acceso a software y herramientas tecnológicas con condiciones especiales para miembros del club."
                    image="lovable-uploads/a2c7e34b-612f-4fec-be68-2066ea3ed943.png"
                    type="Compra Colectiva"
                    location="Nacional"
                    date="Permanente"
                    url="https://lu.ma/elclub"
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </section>
      </main>
      <Footer />
    </>
  );
};

export default Activities;
