import type { Metadata } from 'next';
import AnahuacLanding from '@/components/anahuac/landing';
import { anahuacProgram, cursoAnahuacScholarship } from '@/data/anahuac';
import { siteConfig } from '@/data/site-config';

export const metadata: Metadata = {
  title: 'Certificación en IA Aplicada | Universidad Anáhuac Cancún',
  description: anahuacProgram.description,
  alternates: { canonical: `${siteConfig.url}/cursoanahuac` },
  // Discount variant shared by direct link; keep it out of search results so it
  // doesn't compete with /anahuac.
  robots: { index: false, follow: true },
  openGraph: {
    title: `${anahuacProgram.name} — ${anahuacProgram.institution}`,
    description: anahuacProgram.description,
    type: 'website',
    url: `${siteConfig.url}/cursoanahuac`,
  },
};

export default function CursoAnahuacPage() {
  return <AnahuacLanding beca={cursoAnahuacScholarship} />;
}
