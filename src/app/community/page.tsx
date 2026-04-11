import type { Metadata } from 'next';
import Hero from '@/components/Hero';
import StatsBanner from '@/components/community/stats-banner';
import WhatsappGroups from '@/components/community/whatsapp-groups';
import BenefitsGrid from '@/components/community/benefits-grid';
import JoinCta from '@/components/community/join-cta';

export const metadata: Metadata = {
  title: 'Comunidad',
  description: 'Forma parte de la comunidad de anfitriones y Property Managers más grande de México',
};

export default function CommunityPage() {
  return (
    <>
      <Hero
        title="Nuestra Comunidad"
        subtitle="Forma parte de la comunidad de anfitriones y Property Managers más grande de México"
        backgroundImage="/lovable-uploads/a2c7e34b-612f-4fec-be68-2066ea3ed943.png"
      />
      <section className="section-container">
        <StatsBanner />
        <WhatsappGroups />
        <BenefitsGrid />
        <JoinCta />
      </section>
    </>
  );
}
