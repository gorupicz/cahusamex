import CommunityGroup from '@/components/CommunityGroup';
import { communityGroups } from '@/data/community-groups';

const WhatsappGroups = () => {
  return (
    <div className="mb-16">
      <h2 className="text-navy mb-6 text-center">Comunidad WhatsApp</h2>
      <p className="text-gray-600 text-center max-w-3xl mx-auto mb-8">
        Todos nuestros grupos son gratuitos para permitir un compromiso genuino entre los miembros
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {communityGroups.map((group) => (
          <CommunityGroup key={group.title} {...group} />
        ))}
      </div>
    </div>
  );
};

export default WhatsappGroups;
