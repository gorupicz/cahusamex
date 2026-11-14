// A profile's photo or logo, or its initials when it has none.
import { cn } from '@/lib/utils';

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

export default function ProfileAvatar({ name, photoUrl, className }: { name: string; photoUrl: string | null; className?: string }) {
  if (photoUrl) {
    return <img src={photoUrl} alt="" className={cn('h-14 w-14 shrink-0 rounded-full bg-white object-cover', className)} loading="lazy" />;
  }
  return (
    <span
      aria-hidden="true"
      className={cn('flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary-50 font-heading font-semibold text-navy', className)}
    >
      {initials(name)}
    </span>
  );
}
