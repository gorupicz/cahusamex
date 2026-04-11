import { Users, MessageSquare, Star, ShoppingBag } from 'lucide-react';

const benefits = [
  {
    icon: MessageSquare,
    title: "Intercambio de Conocimientos",
    description: "Acceso a información valiosa y conocimientos compartidos por profesionales experimentados en la industria.",
    items: [
      "Resolución de dudas y problemas comunes",
      "Compartir mejores prácticas de la industria",
      "Acceso a recursos educativos exclusivos",
      "Discusiones sobre tendencias del mercado",
    ],
  },
  {
    icon: Users,
    title: "Networking Profesional",
    description: "Oportunidades para conectar con otros profesionales del sector y expandir tu red de contactos.",
    items: [
      "Contactos con proveedores confiables",
      "Alianzas estratégicas entre miembros",
      "Recomendaciones y referencias de clientes",
      "Colaboraciones para proyectos especiales",
    ],
  },
  {
    icon: Star,
    title: "Desarrollo Profesional",
    description: "Recursos y oportunidades para el crecimiento profesional y el desarrollo de habilidades.",
    items: [
      "Invitaciones a eventos y actividades exclusivas",
      "Acceso prioritario a workshops y charlas",
      "Oportunidades de mentoría con líderes del sector",
      "Reconocimiento dentro de la industria",
    ],
  },
  {
    icon: ShoppingBag,
    title: "Beneficios Comerciales",
    description: "Ventajas económicas y comerciales por ser parte de nuestra comunidad.",
    items: [
      "Participación en compras colectivas",
      "Descuentos especiales con proveedores aliados",
      "Acceso a servicios profesionales con tarifas preferenciales",
      "Oportunidades de negocio entre miembros",
    ],
  },
];

const BenefitsGrid = () => {
  return (
    <div className="mb-16">
      <h2 className="text-navy mb-6 text-center">Beneficios de la Comunidad</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {benefits.map((benefit) => {
          const Icon = benefit.icon;
          return (
            <div key={benefit.title} className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
              <div className="flex items-start mb-4">
                <div className="h-12 w-12 bg-teal-light rounded-lg flex items-center justify-center mr-4">
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-navy">{benefit.title}</h3>
                </div>
              </div>
              <p className="text-gray-600 mb-4">{benefit.description}</p>
              <ul className="list-disc pl-5 text-gray-600 space-y-2">
                {benefit.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BenefitsGrid;
