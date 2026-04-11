import type { Metadata } from 'next';
import Hero from '@/components/Hero';
import HistorySection from '@/components/about/history-section';
import PurposeBanner from '@/components/about/purpose-banner';
import WhatWeDo from '@/components/about/what-we-do';

import { siteConfig } from '@/data/site-config';

export const metadata: Metadata = {
  title: 'Quiénes Somos',
  description: `Conoce la historia y el propósito de la ${siteConfig.name}`,
};

export default function AboutPage() {
  return (
    <>
      <Hero
        title="Quiénes Somos"
        subtitle={`Conoce la historia y el propósito de la ${siteConfig.name}`}
        backgroundImage="/lovable-uploads/27c70ccd-6775-4d50-84e2-e2cd60f72589.png"
      />
      <section className="section-container">
        <HistorySection />
        <PurposeBanner />
        <WhatWeDo />
      </section>
    </>
  );
}
