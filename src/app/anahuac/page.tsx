import type { Metadata } from 'next';
import AnahuacLanding from '@/components/anahuac/landing';
import { anahuacProgram } from '@/data/anahuac';
import { siteConfig } from '@/data/site-config';

export const metadata: Metadata = {
  title: 'Certificación en IA Aplicada | Universidad Anáhuac Cancún',
  description: anahuacProgram.description,
  alternates: { canonical: `${siteConfig.url}/anahuac` },
  openGraph: {
    title: `${anahuacProgram.name} — ${anahuacProgram.institution}`,
    description: anahuacProgram.description,
    type: 'website',
    url: `${siteConfig.url}/anahuac`,
  },
};

export default function AnahuacPage() {
  return <AnahuacLanding beca={anahuacProgram.pricing.scholarship} />;
}
