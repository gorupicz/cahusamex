
import { Calendar, Clock, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ActivityCardProps {
  title: string;
  description: string;
  image: string;
  type: string;
  location: string;
  date?: string;
  url: string;
}

const ActivityCard = ({
  title,
  description,
  image,
  type,
  location,
  date,
  url
}: ActivityCardProps) => {
  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow">
      <img src={image} alt={title} className="w-full h-48 object-cover" />
      <div className="p-6">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xl font-bold text-navy">{title}</h3>
          <span className="bg-teal-light text-white px-2 py-1 rounded text-xs font-medium">
            {type}
          </span>
        </div>
        <p className="text-gray-600 mb-4 line-clamp-3">{description}</p>
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-gray-500">
            <MapPin className="h-4 w-4 mr-2" />
            <span>{location}</span>
          </div>
          {date && (
            <div className="flex items-center text-sm text-gray-500">
              <Calendar className="h-4 w-4 mr-2" />
              <span>{date}</span>
            </div>
          )}
        </div>
        <a 
          href={url} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="btn-outline block text-center"
        >
          Inscríbete
        </a>
      </div>
    </div>
  );
};

export default ActivityCard;
