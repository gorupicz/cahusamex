export interface CommunityGroupData {
  title: string;
  description: string;
  members: number;
  icon?: string;
}

export const communityGroups: CommunityGroupData[] = [
  {
    title: "Grupos por Ciudad",
    description: "Grupos curados para anfitriones organizados por ciudad, permitiendo conexiones locales y compartir información relevante para cada mercado.",
    members: 350,
    icon: "city",
  },
  {
    title: "Grupos Regionales",
    description: "Grupos curados para Property Managers organizados por región, facilitando la colaboración y el intercambio de recursos a nivel regional.",
    members: 150,
    icon: "map",
  },
  {
    title: "VIP Club",
    description: "Grupo exclusivo para los Top-50 Property Managers de México, donde se comparten estrategias avanzadas y oportunidades de negocio.",
    members: 50,
    icon: "star",
  },
];
