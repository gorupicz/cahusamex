import ActivityCard from '@/components/ActivityCard';
import { onlineActivities } from '@/data/activities';

const OnlineActivitiesTab = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {onlineActivities.map((activity) => (
        <ActivityCard key={activity.title} {...activity} />
      ))}
    </div>
  );
};

export default OnlineActivitiesTab;
