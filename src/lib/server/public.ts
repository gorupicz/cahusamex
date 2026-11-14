// What the public directory pages read. Uses the anon key on purpose: the RLS policy
// (published = true) and the column grants decide what comes back, not this code. No filter on
// `published` here: anon cannot even name that column.
import { SLUG_RE, type PublicProfile } from '@/lib/directory/config';
import { env, photoUrl } from './core';

// LinkedIn and WhatsApp are not public columns: a public profile shows them only for paying Connect
// members who opted in (directory_public_contact).
const PUBLIC_COLUMNS = 'id,slug,name,kind,company,job_title,headline,description,services,categories,city,website,photo_path,featured,updated_at';

type Raw = Omit<PublicProfile, 'photo_url'> & { photo_path: string | null };

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
export async function listPublished(): Promise<PublicProfile[] | null> {
  try {
    const rows = await publicRest<Raw[]>(`directory_profiles?select=${PUBLIC_COLUMNS}&order=featured.desc,name.asc&limit=1000`);
    return rows.map(toPublic);
  } catch (err) {
    console.error('directory listing failed', err);
    return null;
  }
}

/** One published profile, with its contact only when its owner shows it. undefined when it can't be read. */
export async function getPublished(slug: string): Promise<PublicProfile | null | undefined> {
  if (!SLUG_RE.test(slug) || slug.length > 80) return null;
  try {
    const [row] = await publicRest<Raw[]>(`directory_profiles?select=${PUBLIC_COLUMNS}&slug=eq.${slug}&limit=1`);
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
