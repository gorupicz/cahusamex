
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar, MapPin, Users } from 'lucide-react';

const cities = [
  "Cancun",
  "Playa del Carmen",
  "Tulum",
  "Guadalajara",
  "Puerto Vallarta",
  "CDMX",
  "Puebla",
  "Los Cabos",
  "La Paz",
  "San Miguel de Allende",
  "Querétaro",
  "Valle de Guadalupe",
  "Ensenada",
  "Tijuana",
  "Oaxaca",
  "Mérida",
  "Monterrey",
  "Puerto Escondido",
  "Huatulco",
  "Ixtapa",
  "San Carlos (Guaymas)",
  "Hermosillo"
];

const DinnerSeriesTable = () => {
  // Group cities in rows of 3 for better display
  const cityRows = [];
  for (let i = 0; i < cities.length; i += 3) {
    cityRows.push(cities.slice(i, i + 3));
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6 mt-8">
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-navy mb-4">Serie de Cenas 2025-2026</h3>
        <p className="text-gray-600 mb-4">
          De abril 2025 a marzo 2026, vamos a realizar 24 cenas de networking en las siguientes ciudades de México. Nuestras cenas son experiencias culinarias únicas y oportunidades para conectar con property managers top en un ambiente muy relajado.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="flex items-center">
            <MapPin className="h-5 w-5 mr-2 text-teal" />
            <span>24 ciudades en todo México</span>
          </div>
          <div className="flex items-center">
            <Users className="h-5 w-5 mr-2 text-teal" />
            <span>121,500 propiedades representadas</span>
          </div>
          <div className="flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-teal" />
            <span>De abril 2025 a marzo 2026</span>
          </div>
        </div>
      </div>
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-center font-bold">Ciudades Participantes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {cityRows.map((row, index) => (
            <TableRow key={index}>
              {row.map((city, cityIndex) => (
                <TableCell key={cityIndex} className="text-center">
                  <span className="font-medium">{city}</span>
                </TableCell>
              ))}
              {/* Fill empty cells if row doesn't have 3 cities */}
              {row.length < 3 && Array(3 - row.length).fill(0).map((_, i) => (
                <TableCell key={`empty-${i}`}></TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      
      <div className="mt-6 p-4 bg-teal-light/10 border border-teal-light rounded-lg">
        <p className="text-navy font-medium">
          Solo hay 3 espacios de patrocinio disponibles por cena. Si estás interesado en participar como patrocinador, contáctanos para más información.
        </p>
      </div>
    </div>
  );
};

export default DinnerSeriesTable;
