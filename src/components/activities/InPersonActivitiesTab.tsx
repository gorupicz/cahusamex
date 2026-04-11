import ActivityCard from '@/components/ActivityCard';
import { inPersonActivities } from '@/data/activities';

const InPersonActivitiesTab = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {inPersonActivities.map((activity) => (
        <ActivityCard key={activity.title} {...activity} />
      ))}
    </div>
  );
};

export default InPersonActivitiesTab;
