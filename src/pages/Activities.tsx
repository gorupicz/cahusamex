
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useState } from 'react';
import ActivitiesHero from '@/components/activities/ActivitiesHero';
import ActivityTabs from '@/components/activities/ActivityTabs';

const Activities = () => {
  const [activeTab, setActiveTab] = useState("all");

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  const openDinnerSeriesTab = () => {
    setActiveTab("dinner-series");
  };

  return (
    <>
      <Navbar />
      <main>
        <ActivitiesHero />
        
        <section className="section-container">
          <ActivityTabs 
            activeTab={activeTab} 
            onTabChange={handleTabChange} 
            openDinnerSeriesTab={openDinnerSeriesTab} 
          />
        </section>
      </main>
      <Footer />
    </>
  );
};

export default Activities;
