// Connect plans as members see them. The limits must match the SQL functions in
// supabase/migrations/20261113120000_directory_connect.sql (connect_icp_limit and
// connect_reserve_intros), which are what actually enforce them.
export type PlanKey = 'starter' | 'business' | 'business_plus';
export type PaidPlan = Exclude<PlanKey, 'starter'>;

export const FREE_INTROS = 3;
export const DAILY_INTROS = 10;
export const ICP_LIMITS: Record<PlanKey, number> = { starter: 1, business: 3, business_plus: 5 };

export const PLAN_NAMES: Record<PlanKey, string> = {
  starter: 'Starter',
  business: 'Business',
  business_plus: 'Business Plus',
};

export const PLANS: { key: PlanKey; name: string; price: string; perks: string[] }[] = [
  { key: 'starter', name: 'Starter', price: 'Gratis', perks: ['1 ICP', `Hasta ${FREE_INTROS} intros por organización`, 'Perfil en el directorio'] },
  { key: 'business', name: 'Business', price: 'MXN $7,990', perks: ['3 ICP', 'Intros ilimitadas', 'Perfil en el directorio'] },
  {
    key: 'business_plus',
    name: 'Business Plus',
    price: 'MXN $9,590',
    perks: ['5 ICP', 'Intros ilimitadas', 'Perfil destacado en el directorio', 'Logo en el newsletter mensual'],
  },
];

/** Paid plans see the match's name before the intro and may show their own contact. */
export const isPaid = (plan: unknown): plan is PaidPlan => plan === 'business' || plan === 'business_plus';
