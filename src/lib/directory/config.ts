// Shared by the directory pages, the profile editor and the API. No secrets here: this file is
// imported by client components too.

// Keys must match the check constraint on directory_profiles.categories.
export const CATEGORY_KEYS = [
  'vacation-rentals',
  'hotels',
  'property-management',
  'real-estate',
  'construction-design',
  'maintenance-cleaning',
  'technology',
  'marketing-sales',
  'finance-legal',
  'tourism',
  'consulting',
  'other',
] as const;
export type CategoryKey = (typeof CATEGORY_KEYS)[number];

export const CATEGORY_LABELS: Record<CategoryKey, string> = {
  'vacation-rentals': 'Renta vacacional',
  hotels: 'Hotelería',
  'property-management': 'Administración de propiedades',
  'real-estate': 'Bienes raíces',
  'construction-design': 'Construcción y diseño de interiores',
  'maintenance-cleaning': 'Limpieza y mantenimiento',
  technology: 'Tecnología y software',
  'marketing-sales': 'Marketing y ventas',
  'finance-legal': 'Finanzas, legal y seguros',
  tourism: 'Turismo y experiencias',
  consulting: 'Consultoría y capacitación',
  other: 'Otra',
};

export const MAX_CATEGORIES = 3;
export const MAX_SERVICES = 12;

export type ProfileKind = 'company' | 'professional';
export const KIND_LABELS: Record<ProfileKind, string> = { company: 'Empresa', professional: 'Profesional' };

// Company size ranges from the Luma import (directory_profiles.company_size).
export const SIZE_LABELS: Record<string, string> = {
  '1-10': '1–10 empleados',
  '11-50': '11–50 empleados',
  '51-200': '51–200 empleados',
  '201-1000': '201–1,000 empleados',
  '1000+': 'Más de 1,000 empleados',
};

export const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const DIRECTORY_PATH = '/directorio';
export const EDIT_PATH = '/directorio/editar';
export const CONNECT_PATH = '/connect';
export const PRIVACY_PATH = '/privacidad';
export const profilePath = (slug: string) => `${DIRECTORY_PATH}/${slug}`;

/** Only same-site paths are accepted as ?next= targets. */
export function safeNext(next: string | null | undefined): string | null {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) return null;
  return next.slice(0, 300);
}

/** What the public pages and the owner's editor get for a profile. */
export interface PublicProfile {
  id: string;
  slug: string;
  name: string;
  kind: ProfileKind;
  company: string | null;
  job_title: string | null;
  headline: string | null;
  description: string | null;
  services: string[];
  categories: CategoryKey[];
  city: string | null;
  website: string | null;
  photo_url: string | null;
  /** Business Plus (Connect): listed first with a badge. */
  featured: boolean;
  updated_at: string;
  /** Only on the profile page, and only when its owner (Business / Business Plus) shows them. */
  linkedin_url?: string | null;
  whatsapp?: string | null;
}

/** The signed-in owner's own row, as /api/directorio/profile returns it. */
export interface OwnerProfile extends Omit<PublicProfile, 'slug' | 'featured'> {
  slug: string | null;
  email: string;
  status: 'claimed' | 'unclaimed';
  published: boolean;
  source_events: string[];
  claimed_at: string | null;
  linkedin_url: string | null;
  whatsapp: string | null;
}
