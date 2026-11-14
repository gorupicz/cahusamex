export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  author: string;
  coverImage?: string;
  /** Path to a self-contained HTML infographic served from /public. Rendered in an iframe. */
  infographic?: {
    src: string;
    /** Approximate aspect ratio (height / width) used for desktop sizing. */
    aspectRatio?: number;
    /** Optional minimum height in pixels for the iframe. */
    minHeight?: number;
  };
  body?: string;
};

export const blogPosts: BlogPost[] = [
  {
    slug: "presencia-redes-sociales-rentas-vacacionales-mexico-2026",
    title:
      "Empresas de Administración de Rentas Vacacionales en México con mayor presencia digital, 2026",
    excerpt:
      "El mapa del property management vacacional en México: los principales operadores del país ordenados por seguidores en Instagram, con el ranking nacional completo.",
    date: "2026-06-01",
    author: "La Bolsa MX × CAHUSAMEX",
    infographic: {
      src: "/blog/presencia-redes-sociales-rentas-vacacionales-mexico-2026.html",
      aspectRatio: 1.35,
      minHeight: 900,
    },
    body: "Esta edición reúne a los principales operadores de renta vacacional de México y los ordena por presencia en redes sociales. La infografía señala en el mapa a los 12 operadores con más seguidores en Instagram y la tabla muestra el ranking nacional completo.",
  },
];

export const getBlogPost = (slug: string): BlogPost | undefined =>
  blogPosts.find((post) => post.slug === slug);
