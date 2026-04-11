import TeamMember from '@/components/TeamMember';
import { teamMembers } from '@/data/team-members';

const FoundersSection = () => {
  return (
    <>
      <div className="text-center mb-12">
        <h2 className="text-navy mb-4">Miembros Fundadores</h2>
        <p className="max-w-3xl mx-auto text-lg text-gray-600">
          Nuestros Miembros Fundadores tienen la misión de promover la competitividad y excelencia en la industria de renta vacacional
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {teamMembers.map((member) => (
          <TeamMember key={member.name} {...member} />
        ))}
      </div>
    </>
  );
};

export default FoundersSection;
