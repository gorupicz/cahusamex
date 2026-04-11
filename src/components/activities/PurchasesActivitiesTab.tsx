import ActivityCard from '@/components/ActivityCard';
import { purchaseActivities } from '@/data/activities';
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
              Aprovechando nuestra comunidad de 1,550 miembros que administran 16,000 propiedades, organizamos compras colectivas. El beneficio es aumentar el valor entregado para todas las partes involucradas. Buscamos acuerdos Win-Win, no solo descuentos al por mayor.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {purchaseActivities.map((activity) => (
          <ActivityCard key={activity.title} {...activity} />
        ))}
      </div>
    </div>
  );
};

export default PurchasesActivitiesTab;
