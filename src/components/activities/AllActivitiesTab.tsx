import ActivityCard from '@/components/ActivityCard';
import { allActivities } from '@/data/activities';

interface AllActivitiesTabProps {
  openDinnerSeriesTab: () => void;
}

const AllActivitiesTab = ({ openDinnerSeriesTab }: AllActivitiesTabProps) => {
  return (
    <>
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
        {allActivities.map((activity) => (
          <ActivityCard key={activity.title} {...activity} />
        ))}
      </div>
    </>
  );
};

export default AllActivitiesTab;
