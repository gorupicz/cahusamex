
import { Users } from 'lucide-react';

interface CommunityGroupProps {
  title: string;
  description: string;
  members: number;
  icon?: string;
}

const CommunityGroup = ({ title, description, members, icon }: CommunityGroupProps) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
      <div className="flex items-start mb-4">
        <div className="h-12 w-12 bg-teal-light rounded-lg flex items-center justify-center mr-4">
          {icon ? (
            <img src={icon} alt={title} className="h-6 w-6" />
          ) : (
            <Users className="h-6 w-6 text-white" />
          )}
        </div>
        <div>
          <h3 className="text-xl font-bold text-navy">{title}</h3>
          <div className="flex items-center text-sm text-gray-500 mt-1">
            <Users className="h-4 w-4 mr-1" />
            <span>{members} miembros</span>
          </div>
        </div>
      </div>
      <p className="text-gray-600">{description}</p>
    </div>
  );
};

export default CommunityGroup;
