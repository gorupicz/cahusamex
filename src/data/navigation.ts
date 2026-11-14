export const navigationLinks = [
  { label: "Quiénes Somos", href: "/about" },
  { label: "Actividades", href: "/activities" },
  { label: "Comunidad", href: "/community" },
  { label: "Proveedores", href: "/providers" },
  { label: "Directorio", href: "/directorio" },
  { label: "Blog", href: "/blog" },
  { label: "Contacto", href: "/contact" },
  { label: "Prensa", href: "https://drive.google.com/drive/folders/1kZUPM2DQkORrccxGouW1ulKJqsVm5SQP?usp=sharing", external: true },
];

export const headerNavigationLinks = navigationLinks.filter(
  (link) => link.href !== "/blog" && link.label !== "Prensa"
);
