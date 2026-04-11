export interface ActivityData {
  title: string;
  description: string;
  image: string;
  type: string;
  location: string;
  date?: string;
  url: string;
}

export const allActivities: ActivityData[] = [
  {
    title: "Cenas de Networking",
    description: "Cenas para networking y Cotorreo! Organizamos eventos en 24 ciudades con 20-40 asistentes que representan aproximadamente 1,000 propiedades por evento.",
    image: "/lovable-uploads/944c4e44-f0bf-41d6-8f00-9bd40b07af2b.png",
    type: "Presencial",
    location: "Múltiples ciudades",
    date: "Programación 2025-2026",
    url: "https://lu.ma/elclub",
  },
  {
    title: "Desayunos de Trabajo",
    description: "Desayunos de trabajo con un experto destacado (un Property Manager top) para aprender e inspirar. Eventos limitados a 10-20 asistentes para mayor interacción.",
    image: "/lovable-uploads/a2d4fc30-7dc1-48d2-b56d-1597688f999f.png",
    type: "Presencial",
    location: "Cancún, Playa del Carmen y más",
    date: "Programación 2025",
    url: "https://lu.ma/desayunos",
  },
  {
    title: "Charlas After Check-in",
    description: "Un tipo diferente de webinar con líderes de opinión de la industria de renta vacacional para tratar temas específicos: impuestos, optimización, pricing, channel management, etc.",
    image: "/lovable-uploads/9caceabd-d08d-4c0f-a7ae-667dda588eaf.png",
    type: "Online",
    location: "Virtual",
    date: "Programación 2025",
    url: "https://lu.ma/charlas",
  },
  {
    title: "Compras Colectivas",
    description: "Aprovechando nuestra comunidad de 550 anfitriones que administran 6,000 propiedades, organizamos compras colectivas para aumentar el valor entregado para todas las partes involucradas.",
    image: "/lovable-uploads/a2c7e34b-612f-4fec-be68-2066ea3ed943.png",
    type: "Iniciativa",
    location: "Nacional",
    date: "Todo el año",
    url: "https://lu.ma/elclub",
  },
];

export const inPersonActivities: ActivityData[] = [
  {
    title: "Cenas de Networking",
    description: "Cenas para networking y Cotorreo! Organizamos eventos en 24 ciudades con 20-40 asistentes que representan aproximadamente 1,000 propiedades por evento.",
    image: "/lovable-uploads/944c4e44-f0bf-41d6-8f00-9bd40b07af2b.png",
    type: "Presencial",
    location: "Múltiples ciudades",
    date: "Programación 2025-2026",
    url: "https://lu.ma/elclub",
  },
  {
    title: "Cenas en la Riviera Maya",
    description: "Eventos de networking en un ambiente relajado para conectar con otros profesionales del sector y compartir experiencias y oportunidades.",
    image: "/lovable-uploads/d5231b7b-dcfd-4ed8-ae93-69197b4a2bad.png",
    type: "Presencial",
    location: "Playa del Carmen",
    date: "Mensual",
    url: "https://lu.ma/elclub",
  },
  {
    title: "Encuentros en CDMX",
    description: "Reuniones en la capital para conectar con anfitriones y administradores de propiedades de todo el país que visitan la ciudad.",
    image: "/lovable-uploads/9ae40046-2d5c-4b5f-bf59-fe77e190ca98.png",
    type: "Presencial",
    location: "Ciudad de México",
    date: "Bimestral",
    url: "https://lu.ma/elclub",
  },
  {
    title: "Desayunos de Trabajo",
    description: "Desayunos de trabajo con un experto destacado (un Property Manager top) para aprender e inspirar. Eventos limitados a 10-20 asistentes para mayor interacción.",
    image: "/lovable-uploads/a2d4fc30-7dc1-48d2-b56d-1597688f999f.png",
    type: "Presencial",
    location: "Cancún, Playa del Carmen y más",
    date: "Programación 2025",
    url: "https://lu.ma/desayunos",
  },
];

export const onlineActivities: ActivityData[] = [
  {
    title: "Charlas After Check-in",
    description: "Un tipo diferente de webinar con líderes de opinión de la industria de renta vacacional para tratar temas específicos: impuestos, optimización, pricing, channel management, etc.",
    image: "/lovable-uploads/9caceabd-d08d-4c0f-a7ae-667dda588eaf.png",
    type: "Online",
    location: "Virtual",
    date: "Programación 2025",
    url: "https://lu.ma/charlas",
  },
  {
    title: "Seminarios Web",
    description: "Sesiones educativas sobre tendencias del mercado, novedades tecnológicas y aspectos legales relevantes para los Property Managers y anfitriones.",
    image: "/lovable-uploads/40eab1c4-247b-49be-b5f4-085658d5a3af.png",
    type: "Online",
    location: "Virtual",
    date: "Mensual",
    url: "https://lu.ma/charlas",
  },
];

export const purchaseActivities: ActivityData[] = [
  {
    title: "Insumos de Limpieza",
    description: "Compras colectivas de productos de limpieza de alta calidad a precios especiales para miembros de nuestra comunidad.",
    image: "/lovable-uploads/a2c7e34b-612f-4fec-be68-2066ea3ed943.png",
    type: "Compra Colectiva",
    location: "Nacional",
    date: "Trimestral",
    url: "https://lu.ma/elclub",
  },
  {
    title: "Amenidades",
    description: "Amenidades personalizadas con el branding de cada Property Manager a precios competitivos gracias al volumen de compra.",
    image: "/lovable-uploads/a2c7e34b-612f-4fec-be68-2066ea3ed943.png",
    type: "Compra Colectiva",
    location: "Nacional",
    date: "Bimestral",
    url: "https://lu.ma/elclub",
  },
  {
    title: "Servicios Tecnológicos",
    description: "Acceso a software y herramientas tecnológicas con condiciones especiales para miembros del club.",
    image: "/lovable-uploads/a2c7e34b-612f-4fec-be68-2066ea3ed943.png",
    type: "Compra Colectiva",
    location: "Nacional",
    date: "Permanente",
    url: "https://lu.ma/elclub",
  },
];

export const homePreviewActivities: ActivityData[] = [
  allActivities[0],
  allActivities[1],
  allActivities[2],
];
