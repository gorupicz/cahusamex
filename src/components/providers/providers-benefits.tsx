import { Megaphone, CalendarDays, Handshake, GraduationCap } from 'lucide-react';

const benefits = [
  {
    icon: Megaphone,
    title: 'Visibilidad ante la comunidad',
    description: 'Posiciona tu marca frente a propietarios y administradores que deciden las compras.',
    items: [
      'Acceso a los grupos de WhatsApp de Proveedores y Marketplace',
      'Post de bienvenida en el canal de anuncios de la comunidad',
      'Difusión en los canales de la asociación',
      'Exposición directa ante operadores de rentas vacacionales',
    ],
  },
  {
    icon: CalendarDays,
    title: 'Presencia en eventos',
    description: 'Conecta cara a cara con la industria en las actividades presenciales.',
    items: [
      'Participación en las actividades de networking y capacitación',
      'Presencia en los eventos de tu ciudad y en todo México',
      'Contacto directo con operadores y administradores de propiedades',
      'Hasta 60% de descuento en las actividades presenciales',
    ],
  },
  {
    icon: Handshake,
    title: 'Oportunidades de negocio',
    description: 'Genera alianzas y nuevas relaciones comerciales con los miembros de la asociación.',
    items: [
      'Invitaciones como ponente a capacitaciones in-company',
      'Oportunidades de sponsoreo y colaboración en programas especiales',
      'Alianzas estratégicas con empresas de property management',
      'Nuevas oportunidades comerciales dentro de la red',
    ],
  },
  {
    icon: GraduationCap,
    title: 'Beneficios y descuentos',
    description: 'Ventajas exclusivas para tu empresa y tu equipo de trabajo.',
    items: [
      '35% de beca en maestrías y diplomados de la Universidad Anáhuac',
      'Descuentos preferenciales en las actividades de la Cámara',
      'Beneficios extensivos a tus colaboradores',
      'Acceso a una red consolidada de la hospitalidad',
    ],
  },
];

const ProvidersBenefits = () => {
  return (
    <div className="mb-16">
      <h2 className="text-navy mb-6 text-center">Beneficios de afiliarte como Proveedor</h2>
      <p className="text-gray-600 text-center max-w-3xl mx-auto mb-8">
        Todo lo que tu empresa gana al sumarse a la Cámara, sin importar la categoría de proveedor que elijas
      </p>

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

export default ProvidersBenefits;
