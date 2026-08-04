/**
 * Landing page data for the "Certificación en Herramientas de IA Aplicadas a
 * Productividad Profesional" (Universidad Anáhuac Cancún x CAHUSAMEX).
 *
 * Everything the marketing team needs to tweak lives here.
 */

export const anahuacProgram = {
  name: "Certificación en Herramientas de IA Aplicadas a Productividad Profesional",
  shortName: "Certificación en IA Aplicada",
  institution: "Universidad Anáhuac Cancún",
  description:
    "Aprende a usar el stack profesional de inteligencia artificial para trabajar de forma más eficiente, ahorrar tiempo y mejorar tus resultados profesionales.",

  /**
   * Official Universidad Anáhuac Cancún badge, supplied by the university.
   * Square, with its own orange field — it needs no plate behind it.
   */
  logo: "/uploads/anahuac-logo.png",

  /** Stripe payment link the form redirects to after the lead is captured. */
  checkoutUrl: "https://buy.stripe.com/14AaEW95m0xAdWS5fUb3q0c",

  /**
   * Google Form owned by La Bolsa MX (goru@g14t.com) — NOT the Anáhuac one.
   * Leads land in "Leads — Certificación IA Anáhuac Cancún" and get reported
   * to the university from there.
   */
  formUrl:
    "https://docs.google.com/forms/d/e/1FAIpQLSePYnC3b1unWz7VXbx6BH0Tm964izeCMaFLSLJgXF-YX9IonA/viewform",
  /** The landing renders the form natively and POSTs straight to this endpoint. */
  formActionUrl:
    "https://docs.google.com/forms/d/e/1FAIpQLSePYnC3b1unWz7VXbx6BH0Tm964izeCMaFLSLJgXF-YX9IonA/formResponse",
  /** Responses spreadsheet, for reference. */
  leadsSheetUrl:
    "https://docs.google.com/spreadsheets/d/1t8ChNz38CgiuFtKblU9YhoU_gHC8RbGSNfRcC_chuEE/edit",

  /** Instagram post embedded on the page. */
  instagramUrl: "https://www.instagram.com/p/DbnikFutyfY/",
  /**
   * Optional self-hosted copy of the reel (e.g. "/uploads/anahuac-reel.mp4").
   * When set, the page renders a native <video> that autoplays muted on load
   * instead of the Instagram embed (Instagram blocks autoplay inside iframes).
   */
  instagramVideoSrc: "",

  facts: {
    modality: "Semipresencial",
    duration: "10 semanas",
    start: "Octubre 2026",
  },

  pricing: {
    enrollment: 1500,
    tuition: 10000,
    total: 11500,
    scholarship: {
      label: "Beca La Bolsa MX / CAHUSAMEX",
      discount: 35,
      deadline: "31 de agosto de 2026",
      deadlineISO: "2026-08-31",
      tuition: 6825,
      enrollment: 1500,
      total: 8325,
      savings: 3175,
    },
  },

  tools: [
    "ChatGPT",
    "Claude",
    "Gemini",
    "Perplexity",
    "Copilot",
    "Gamma",
    "NotebookLM",
  ],

  audience: [
    {
      title: "Profesionales",
      description:
        "Que quieren recuperar horas de su semana automatizando tareas repetitivas.",
    },
    {
      title: "Empresarios y directivos",
      description:
        "Que necesitan decidir más rápido con reportes, análisis y presentaciones asistidos por IA.",
    },
    {
      title: "Consultores",
      description:
        "Que buscan multiplicar su capacidad de investigación, redacción y entrega de proyectos.",
    },
    {
      title: "Emprendedores",
      description:
        "Que operan con equipos pequeños y quieren producir como uno mucho más grande.",
    },
  ],

  modules: [
    {
      title: "El stack profesional de IA y diagnóstico de tu tiempo",
      description:
        "Qué herramienta usar para cada tarea y dónde se te va realmente la semana.",
    },
    {
      title: "Comunicación profesional: emails, mensajes y reuniones",
      description:
        "Redacción, seguimiento y minutas de reunión con calidad ejecutiva en minutos.",
    },
    {
      title: "Investigación, lectura y conocimiento personal",
      description:
        "Investigar con fuentes, resumir documentos extensos y construir tu base de conocimiento.",
    },
    {
      title: "Documentos, modelos y presentaciones con IA",
      description:
        "Propuestas, contratos, plantillas y presentaciones listas para presentar.",
    },
    {
      title: "Datos, campañas y reportería ejecutiva con IA",
      description:
        "Analizar información, generar campañas y armar reportes para dirección.",
    },
    {
      title: "Proyecto integrador: tu workflow profesional optimizado",
      description:
        "Cierras la certificación con tu propio flujo de trabajo documentado y funcionando.",
    },
  ],

  benefits: [
    "No necesitas conocimientos técnicos ni saber programar.",
    "Enfoque 100% práctico: aplicas la IA desde el primer día en tu trabajo o negocio.",
    "Casos y ejercicios sobre tareas reales, no ejemplos de laboratorio.",
    "Certificación avalada por la Universidad Anáhuac Cancún.",
  ],
} as const;

export const formatMXN = (amount: number) =>
  `$${amount.toLocaleString("es-MX")} MXN`;

/**
 * Fields of the inscription form, mirroring the Google Form question ids.
 *
 * The `entry` values must match the live form exactly — they are what routes a
 * value to the right column in the responses spreadsheet. Labels here are ours,
 * so accents and wording are cleaned up relative to the Google Form.
 */
export type InscriptionField = {
  entry: string;
  label: string;
  help?: string;
  full?: boolean;
  autoComplete?: string;
} & (
  | { kind: "text" | "email" | "tel" | "date" | "number" | "textarea" }
  | {
      kind: "radio" | "select";
      /**
       * `value` must be the exact option string defined in the Google Form —
       * Google validates choice answers against it. `label` is what we display.
       */
      options: readonly { value: string; label: string }[];
      allowOther?: boolean;
    }
);

export const inscriptionFields: readonly InscriptionField[] = [
  {
    kind: "text",
    entry: "entry.1737235450",
    label: "Nombre(s)",
    autoComplete: "given-name",
  },
  {
    kind: "text",
    entry: "entry.2110734542",
    label: "Apellido paterno",
    autoComplete: "family-name",
  },
  {
    kind: "text",
    entry: "entry.1869838634",
    label: "Apellido materno",
  },
  {
    kind: "email",
    entry: "entry.571477710",
    label: "Correo electrónico",
    autoComplete: "email",
  },
  {
    kind: "tel",
    entry: "entry.1386627665",
    label: "Teléfono celular",
    autoComplete: "tel",
  },
  {
    kind: "date",
    entry: "entry.612540704",
    label: "Fecha de nacimiento",
  },
  {
    kind: "number",
    entry: "entry.1321168982",
    label: "Edad",
  },
  {
    kind: "radio",
    entry: "entry.90467849",
    label: "Género",
    options: [
      { value: "Mujer", label: "Mujer" },
      { value: "Hombre", label: "Hombre" },
    ],
  },
  {
    kind: "text",
    entry: "entry.96703602",
    label: "País",
    help: "Por ejemplo: México, EUA",
    autoComplete: "country-name",
  },
  {
    kind: "text",
    entry: "entry.338808261",
    label: "Ciudad",
    help: "Por ejemplo: Cancún, Washington",
    autoComplete: "address-level2",
  },
  {
    kind: "text",
    entry: "entry.1361731091",
    label: "Empresa donde laboras",
    help: "Por ejemplo: Hotel Dreams",
    autoComplete: "organization",
  },
  {
    kind: "text",
    entry: "entry.689235723",
    label: "Puesto",
    help: "Por ejemplo: Director, Gerente de operaciones",
    autoComplete: "organization-title",
  },
  {
    kind: "text",
    entry: "entry.52445420",
    label: "Sector",
    help: "Por ejemplo: Hotelería",
  },
  {
    kind: "select",
    entry: "entry.1328348322",
    label: "Antigüedad en la empresa",
    options: [
      { value: "1 mes", label: "1 mes" },
      { value: "2 meses", label: "2 meses" },
      { value: "3 meses", label: "3 meses" },
      { value: "1 año", label: "1 año" },
      { value: "2 años", label: "2 años" },
      { value: "Más de 3 años", label: "Más de 3 años" },
      { value: "Más de 5 años", label: "Más de 5 años" },
      { value: "Más de 10 años", label: "Más de 10 años" },
    ],
  },
  {
    kind: "textarea",
    entry: "entry.834109617",
    label: "Estudios superiores",
    help: "Por ejemplo: Licenciatura en Administración. Si no cuentas con estudios superiores, escribe N/A.",
    full: true,
  },
  {
    kind: "select",
    entry: "entry.1160033800",
    label: "¿Cómo te enteraste del programa?",
    options: [
      { value: "Correo", label: "Correo" },
      { value: "AMPI Playa del Carmen", label: "AMPI Playa del Carmen" },
      { value: "ADVI", label: "ADVI" },
      { value: "La Bolsa", label: "La Bolsa" },
      { value: "Recomendación", label: "Recomendación" },
      { value: "Redes sociales", label: "Redes sociales" },
      { value: "MasterClass (clase muestra)", label: "MasterClass (clase muestra)" },
      { value: "WhatsApp", label: "WhatsApp" },
    ],
    allowOther: true,
    full: true,
  },
];
