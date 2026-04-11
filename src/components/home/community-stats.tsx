import { communityStats } from '@/data/stats';

const CommunityStats = () => {
  return (
    <div className="bg-white rounded-xl shadow-md p-8 md:p-12 mb-12">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
        {communityStats.map((stat) => (
          <div key={stat.label}>
            <p className="text-5xl font-bold text-teal mb-2">{stat.value}</p>
            <p className="text-xl text-navy">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CommunityStats;
