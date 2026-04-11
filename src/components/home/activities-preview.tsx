import Link from 'next/link';
import ActivityCard from '@/components/ActivityCard';
import { homePreviewActivities } from '@/data/activities';

const ActivitiesPreview = () => {
  return (
    <section className="bg-sand-light py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-navy mb-4">Nuestras Actividades 2025</h2>
          <p className="max-w-3xl mx-auto text-lg text-gray-600">
            Organizamos eventos presenciales y virtuales para fortalecer nuestra comunidad
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {homePreviewActivities.map((activity) => (
            <ActivityCard key={activity.title} {...activity} />
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link href="/activities" className="btn-primary">
            Ver todas las actividades
          </Link>
        </div>
      </div>
    </section>
  );
};

export default ActivitiesPreview;
