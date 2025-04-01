
import { Linkedin } from 'lucide-react';

interface TeamMemberProps {
  name: string;
  title: string;
  image?: string;
  linkedIn?: string;
}

const TeamMember = ({ name, title, image, linkedIn }: TeamMemberProps) => {
  return (
    <div className="text-center">
      <div className="relative mb-4 mx-auto w-48 h-48 overflow-hidden rounded-full">
        {image ? (
          <img 
            src={image} 
            alt={name} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-navy-light flex items-center justify-center">
            <span className="text-white text-4xl font-bold">
              {name.split(' ').map(part => part[0]).join('')}
            </span>
          </div>
        )}
      </div>
      <h3 className="text-xl font-bold text-navy">{name}</h3>
      <p className="text-gray-600 mb-2">{title}</p>
      {linkedIn && (
        <a 
          href={linkedIn} 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center text-teal hover:text-teal-dark transition-colors"
        >
          <Linkedin className="h-5 w-5 mr-1" />
          <span>LinkedIn</span>
        </a>
      )}
    </div>
  );
};

export default TeamMember;
