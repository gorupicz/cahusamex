import { communityStatsDetailed } from '@/data/stats';

const StatsBanner = () => {
  return (
    <div className="bg-navy-light text-white p-8 rounded-xl text-center mb-16">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {communityStatsDetailed.map((stat) => (
          <div key={stat.label}>
            <p className="text-5xl font-bold text-teal-light mb-2">{stat.value}</p>
            <p className="text-xl">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StatsBanner;
