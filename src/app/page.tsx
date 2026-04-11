import type { Metadata } from 'next';
import Hero from '@/components/Hero';
import AboutSection from '@/components/home/about-section';
import DinnerHighlight from '@/components/home/dinner-highlight';
import ActivitiesPreview from '@/components/home/activities-preview';
import CommunityStats from '@/components/home/community-stats';

import CtaSection from '@/components/home/cta-section';
import { siteConfig } from '@/data/site-config';

export const metadata: Metadata = {
  title: `${siteConfig.name}`,
};

export default function HomePage() {
  return (
    <>
      <Hero
        title={`${siteConfig.name}`}
        subtitle="Promovemos la competitividad en la industria del bien raíz de renta vacacional en México y USA"
        backgroundImage="/lovable-uploads/27c70ccd-6775-4d50-84e2-e2cd60f72589.png"
        showButton={true}
      />
      <AboutSection />
      <DinnerHighlight />
      <ActivitiesPreview />
      <section className="section-container">
        <CommunityStats />
      </section>
      <CtaSection />
    </>
  );
}
