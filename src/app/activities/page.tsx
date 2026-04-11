'use client';

import { useState, useEffect } from 'react';
import ActivitiesHero from '@/components/activities/ActivitiesHero';
import ActivityTabs from '@/components/activities/ActivityTabs';

export default function ActivitiesPage() {
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    if (window.location.hash === '#dinner-series') {
      setActiveTab('dinner-series');
    }
  }, []);

  return (
    <>
      <ActivitiesHero />
      <section className="section-container">
        <ActivityTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          openDinnerSeriesTab={() => setActiveTab("dinner-series")}
        />
      </section>
    </>
  );
}
