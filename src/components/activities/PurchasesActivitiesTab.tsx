
import ActivityCard from '@/components/ActivityCard';
import { ShoppingBag } from 'lucide-react';

const PurchasesActivitiesTab = () => {
  return (
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
  );
};

export default PurchasesActivitiesTab;
