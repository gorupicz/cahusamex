'use client';

// The published profiles with a text search and filters. Every profile is already on the page (a
// few thousand short rows), so filtering happens in the browser; only the cards are paged.
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  CATEGORY_KEYS,
  CATEGORY_LABELS,
  KIND_LABELS,
  OTHER_CITIES,
  placeLine,
  type ListedProfile,
  type ProfileKind,
  profilePath,
} from '@/lib/directory/config';
import ProfileAvatar from './ProfileAvatar';

const fold = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();

const otherCitiesOf = (p: ListedProfile) => p.cities_other ?? (p.cities === undefined && p.city?.trim() ? [p.city.trim()] : []);

/** Cards shown at first and added by "Ver más". */
const PAGE_SIZE = 60;

/** Fuller profiles first: featured, then claimed, then by how much they say about themselves. */
const richness = (p: ListedProfile) =>
  (p.featured ? 100 : 0) +
  (p.status === 'claimed' ? 50 : 0) +
  (p.photo_url ? 8 : 0) +
  (p.headline ? 6 : 0) +
  (p.categories.length ? 4 : 0) +
  (p.services.length ? 4 : 0) +
  (p.company ? 3 : 0) +
  (p.job_title ? 2 : 0) +
  (p.city ? 1 : 0);

const selectClasses =
  'h-10 rounded-md border border-input bg-white px-3 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-ring';

export default function DirectoryList({ profiles: unsorted }: { profiles: ListedProfile[] }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [kind, setKind] = useState('');
  const [city, setCity] = useState('');
  const [shown, setShown] = useState(PAGE_SIZE);

  // Stable: the server sends them by name, and equal scores keep that order.
  const profiles = useMemo(() => [...unsorted].sort((a, b) => richness(b) - richness(a)), [unsorted]);

  // The canonical cities in use, most profiles first, then "Otras" (a city that maps to none).
  // Before the migration a profile only has the free text, so it counts as "Otras".
  const { cities, otherCount } = useMemo(() => {
    const counts = new Map<string, number>();
    let other = 0;
    for (const p of profiles) {
      for (const c of p.cities ?? []) counts.set(c, (counts.get(c) ?? 0) + 1);
      if (otherCitiesOf(p).length) other++;
    }
    return {
      cities: [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'es')),
      otherCount: other,
    };
  }, [profiles]);

  const visible = useMemo(() => {
    const q = fold(query.trim());
    return profiles.filter((p) => {
      if (category && !p.categories.includes(category as never)) return false;
      if (kind && p.kind !== kind) return false;
      if (city && !(city === OTHER_CITIES ? otherCitiesOf(p).length > 0 : p.cities?.includes(city))) return false;
      if (!q) return true;
      const haystack = fold([p.name, p.company, p.job_title, p.headline, p.city, ...(p.cities ?? []), ...p.services].filter(Boolean).join(' '));
      return haystack.includes(q);
    });
  }, [profiles, query, category, kind, city]);

  const filtered = query || category || kind || city;

  // A new search starts from the first page again.
  useEffect(() => setShown(PAGE_SIZE), [query, category, kind, city]);

  return (
    <div>
      <div className="mb-6 grid gap-3 md:grid-cols-[1fr_auto_auto_auto]">
        <label className="relative block">
          <span className="sr-only">Buscar</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            type="search"
            placeholder="Nombre, empresa, servicio…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </label>
        <select aria-label="Categoría" className={selectClasses} value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">Todas las categorías</option>
          {CATEGORY_KEYS.map((key) => (
            <option key={key} value={key}>
              {CATEGORY_LABELS[key]}
            </option>
          ))}
        </select>
        <select aria-label="Tipo" className={selectClasses} value={kind} onChange={(e) => setKind(e.target.value)}>
          <option value="">Empresas y profesionales</option>
          {(Object.keys(KIND_LABELS) as ProfileKind[]).map((key) => (
            <option key={key} value={key}>
              {KIND_LABELS[key]}
            </option>
          ))}
        </select>
        <select aria-label="Ciudad" className={selectClasses} value={city} onChange={(e) => setCity(e.target.value)}>
          <option value="">Todas las ciudades</option>
          {cities.map(([c, n]) => (
            <option key={c} value={c}>
              {`${c} (${n.toLocaleString('es-MX')})`}
            </option>
          ))}
          {otherCount > 0 && <option value={OTHER_CITIES}>{`Otras (${otherCount.toLocaleString('es-MX')})`}</option>}
        </select>
      </div>

      <div className="mb-4 flex items-center justify-between text-sm text-muted-foreground">
        <span aria-live="polite">
          {visible.length === 1 ? '1 perfil' : `${visible.length.toLocaleString('es-MX')} perfiles`}
        </span>
        {filtered && (
          <button
            type="button"
            className="text-teal underline-offset-4 hover:underline"
            onClick={() => {
              setQuery('');
              setCategory('');
              setKind('');
              setCity('');
            }}
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {profiles.length === 0 ? (
        <p className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
          Todavía no hay perfiles publicados. ¿Fuiste a un evento de CAHUSA MX? Reclama el tuyo.
        </p>
      ) : visible.length === 0 ? (
        <p className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">Ningún perfil coincide con tu búsqueda.</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.slice(0, shown).map((p) => (
            <li key={p.id}>
              <Link
                href={profilePath(p.slug)}
                className={`flex h-full gap-4 rounded-xl border bg-white p-5 transition-shadow hover:shadow-md ${p.featured ? 'border-gold' : ''}`}
              >
                <ProfileAvatar name={p.name} photoUrl={p.photo_url} />
                <span className="min-w-0">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-heading font-semibold text-navy">{p.name}</span>
                    {p.featured && <span className="rounded-full bg-gold-light/30 px-2 py-0.5 text-xs font-medium text-gold-dark">Destacado</span>}
                  </span>
                  {(p.job_title || p.company) && (
                    <span className="block text-sm text-muted-foreground">
                      {[p.job_title, p.kind === 'professional' ? p.company : null].filter(Boolean).join(' · ')}
                    </span>
                  )}
                  {p.headline && <span className="mt-2 block text-sm text-navy">{p.headline}</span>}
                  <span className="mt-2 block text-xs text-muted-foreground">
                    {[KIND_LABELS[p.kind], placeLine(p), ...p.categories.map((c) => CATEGORY_LABELS[c])].filter(Boolean).join(' · ')}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {visible.length > shown && (
        <div className="mt-8 flex flex-col items-center gap-2">
          <button type="button" className="btn-outline" onClick={() => setShown((n) => n + PAGE_SIZE)}>
            Ver más perfiles
          </button>
          <span className="text-sm text-muted-foreground">
            Mostrando {shown.toLocaleString('es-MX')} de {visible.length.toLocaleString('es-MX')}
          </span>
        </div>
      )}
    </div>
  );
}
