import type { Metadata } from 'next';
import AnahuacLanding from '@/components/anahuac/landing';
import GroupCheckout from '@/components/anahuac/group-checkout';
import { anahuacProgram } from '@/data/anahuac';
import { siteConfig } from '@/data/site-config';

export const metadata: Metadata = {
  title: 'Certificación en IA Aplicada para grupos | Universidad Anáhuac Cancún',
  description: anahuacProgram.description,
  alternates: { canonical: `${siteConfig.url}/grupos-anahuac` },
  // Offer shared by direct link with companies; keep it out of search results.
  robots: { index: false, follow: true },
  openGraph: {
    title: `${anahuacProgram.name} — Grupos`,
    description: anahuacProgram.description,
    type: 'website',
    url: `${siteConfig.url}/grupos-anahuac`,
  },
};

export default function GruposAnahuacPage() {
  return (
    <AnahuacLanding
      beca={anahuacProgram.pricing.scholarship}
      checkout={<GroupCheckout />}
      ctaLabel="INSCRIBIR A MI EQUIPO"
    />
  );
}
