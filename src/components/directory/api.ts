// Browser side of /api/directorio/*: every call is same-origin and carries the session cookie.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ApiResult = { status: number; body: any };

export async function api(path: string, init: RequestInit = {}): Promise<ApiResult> {
  try {
    const res = await fetch(`/api/directorio/${path}`, { credentials: 'same-origin', ...init });
    return { status: res.status, body: await res.json().catch(() => ({ ok: false, reason: 'unavailable' })) };
  } catch {
    return { status: 0, body: { ok: false, reason: 'unavailable' } };
  }
}

export const post = (path: string, data: unknown = {}) =>
  api(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });

/** Error reasons from the API, as members read them. */
export const ERRORS: Record<string, string> = {
  email_invalid: 'Revisa tu correo, parece que tiene un error.',
  cooldown: 'Espera un minuto antes de pedir otro código.',
  rate_limited: 'Pediste demasiados códigos. Intenta de nuevo en una hora.',
  code_invalid: 'El código no es correcto. Revísalo e intenta de nuevo.',
  code_expired: 'El código venció o ya se usó. Pide uno nuevo.',
  invalid: 'Revisa los campos marcados.',
  save_first: 'Guarda tu perfil una vez para poder subir una imagen.',
  photo_type: 'La imagen debe ser JPG, PNG o WebP.',
  photo_size: 'La imagen pesa demasiado (máximo 3 MB).',
  icp_short: 'Describe tu cliente ideal con un poco más de detalle (mínimo 20 caracteres).',
  search_limit: 'Llegaste al límite de búsquedas de hoy. Vuelve mañana.',
  icp_limit: 'Ya usaste todos los ICP de tu plan. Elige uno de tus ICP o cambia de plan.',
  search_expired: 'Esta búsqueda ya venció. Busca de nuevo para pedir intros.',
  incomplete_name: 'La intro te presenta por tu nombre: escribe tu nombre y apellido completos en tu perfil.',
  not_found: 'Ese perfil ya no está en el directorio.',
  self_intro: 'Ese es tu propio perfil.',
  send_failed: 'No pudimos enviar la intro. Intenta de nuevo en un momento.',
  paid_only: 'Mostrar tus datos de contacto es parte de Business y Business Plus.',
  refused: 'No pudimos procesar esa descripción. Reescríbela e intenta de nuevo.',
  none_selected: 'Selecciona al menos una persona.',
  daily_limit: 'Llegaste al máximo de 10 intros por día. Vuelve mañana.',
  free_limit: 'Ya no alcanzan las intros gratis de tu organización. Suscríbete para pedir más.',
  already_introduced: 'Ya los presentamos antes.',
  billing_unavailable: 'Las suscripciones todavía no están disponibles. Escríbenos a goru@cahusa.mx.',
  no_subscription: 'No encontramos tu suscripción. Escríbenos a goru@cahusa.mx.',
  no_profile: 'Necesitas un perfil en el directorio para usar Connect.',
  unauthorized: 'Tu sesión venció. Vuelve a entrar con tu correo.',
  forbidden: 'No pudimos verificar la solicitud. Recarga la página.',
  unavailable: 'Algo falló de nuestro lado. Intenta de nuevo en un momento.',
};

export const errorText = (reason: unknown) => ERRORS[typeof reason === 'string' ? reason : ''] ?? ERRORS.unavailable;
