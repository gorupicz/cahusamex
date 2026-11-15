// What the public directory pages read. Uses the anon key on purpose: the RLS policy
// (published = true) and the column grants decide what comes back, not this code. No filter on
// `published` here: anon cannot even name that column.
import { SLUG_RE, type ListedProfile, type PublicProfile } from '@/lib/directory/config';
import { env, photoUrl } from './core';

// LinkedIn and WhatsApp are not public columns: a public profile shows them only for paying Connect
// members who opted in (directory_public_contact).
const PUBLIC_COLUMNS =
  'id,slug,name,kind,company,job_title,headline,description,services,categories,city,cities,cities_other,website,photo_path,featured,status,updated_at';
const LIST_COLUMNS = 'id,slug,name,kind,company,job_title,headline,services,categories,city,cities,cities_other,photo_path,featured,status';
// PostgREST on Supabase returns at most 1000 rows per request.
const PAGE = 1000;
const MAX_LISTED = 20000;

type Raw = Omit<PublicProfile, 'photo_url'> & { photo_path: string | null };
type RawListed = Omit<ListedProfile, 'photo_url'> & { photo_path: string | null };

// Before 20261116120000_directory_cities there are no cities columns (42703): read without them.
const WITHOUT_CITIES = (columns: string) => columns.replace(',cities,cities_other', '');
const missingColumn = (err: unknown) => /42703/.test(String(err));

async function publicRest<T>(path: string): Promise<T> {
  if (!env.supabaseUrl || !env.anonKey) throw new Error('directory: SUPABASE_URL or SUPABASE_ANON_KEY is not set');
  const res = await fetch(`${env.supabaseUrl}/rest/v1/${path}`, {
    headers: { apikey: env.anonKey, Authorization: `Bearer ${env.anonKey}` },
    // A public page may lag 30 s behind an edit, so unpublishing takes effect fast.
    next: { revalidate: 30 },
  });
  if (!res.ok) throw new Error(`directory public ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

const toPublic = ({ photo_path, ...rest }: Raw): PublicProfile => ({ ...rest, photo_url: photoUrl(photo_path) });

/** Published profiles, featured first. null when the directory can't be read (the page says so). */
export async function listPublished(): Promise<ListedProfile[] | null> {
  try {
    const rows: RawListed[] = [];
    let columns = LIST_COLUMNS;
    const read = (offset: number) =>
      publicRest<RawListed[]>(`directory_profiles?select=${columns}&order=featured.desc,name.asc,id.asc&limit=${PAGE}&offset=${offset}`);
    for (let offset = 0; offset < MAX_LISTED; offset += PAGE) {
      const page = await read(offset).catch((err) => {
        if (offset > 0 || !missingColumn(err)) throw err;
        columns = WITHOUT_CITIES(LIST_COLUMNS);
        return read(offset);
      });
      rows.push(...page);
      if (page.length < PAGE) break;
    }
    return rows.map(({ photo_path, ...rest }) => ({ ...rest, photo_url: photoUrl(photo_path) }));
  } catch (err) {
    console.error('directory listing failed', err);
    return null;
  }
}

/** One published profile, with its contact only when its owner shows it. undefined when it can't be read. */
export async function getPublished(slug: string): Promise<PublicProfile | null | undefined> {
  if (!SLUG_RE.test(slug) || slug.length > 80) return null;
  try {
    const read = (columns: string) => publicRest<Raw[]>(`directory_profiles?select=${columns}&slug=eq.${slug}&limit=1`);
    const [row] = await read(PUBLIC_COLUMNS).catch((err) => {
      if (!missingColumn(err)) throw err;
      return read(WITHOUT_CITIES(PUBLIC_COLUMNS));
    });
    if (!row) return null;
    return { ...toPublic(row), ...(await getContact(slug)) };
  } catch (err) {
    console.error('directory profile failed', slug, err);
    return undefined;
  }
}

async function getContact(slug: string): Promise<Pick<PublicProfile, 'linkedin_url' | 'whatsapp'>> {
  try {
    const [row] = await publicRest<{ linkedin_url: string | null; whatsapp: string | null }[]>(`rpc/directory_public_contact?p_slug=${slug}`);
    return { linkedin_url: row?.linkedin_url ?? null, whatsapp: row?.whatsapp ?? null };
  } catch (err) {
    console.error('directory contact failed', slug, err);
    return { linkedin_url: null, whatsapp: null };
  }
}
