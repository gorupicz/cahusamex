
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AllActivitiesTab from './AllActivitiesTab';
import DinnerSeriesTab from './DinnerSeriesTab';
import InPersonActivitiesTab from './InPersonActivitiesTab';
import OnlineActivitiesTab from './OnlineActivitiesTab';
import PurchasesActivitiesTab from './PurchasesActivitiesTab';

interface ActivityTabsProps {
  activeTab: string;
  onTabChange: (value: string) => void;
  openDinnerSeriesTab: () => void;
}

const ActivityTabs = ({ activeTab, onTabChange, openDinnerSeriesTab }: ActivityTabsProps) => {
  return (
    <Tabs value={activeTab} onValueChange={onTabChange} defaultValue="all" className="w-full">
      <div className="flex justify-center mb-8">
        <TabsList className="bg-sand-light">
          <TabsTrigger value="all">Todas</TabsTrigger>
          <TabsTrigger value="dinner-series">Cenas 2025-2026</TabsTrigger>
          <TabsTrigger value="in-person">Presenciales</TabsTrigger>
          <TabsTrigger value="online">Online</TabsTrigger>
          <TabsTrigger value="purchases">Compras Colectivas</TabsTrigger>
        </TabsList>
      </div>
      
      <TabsContent value="all">
        <AllActivitiesTab openDinnerSeriesTab={openDinnerSeriesTab} />
      </TabsContent>
      
      <TabsContent value="dinner-series" id="dinner-series">
        <DinnerSeriesTab />
      </TabsContent>
      
      <TabsContent value="in-person">
        <InPersonActivitiesTab />
      </TabsContent>
      
      <TabsContent value="online">
        <OnlineActivitiesTab />
      </TabsContent>
      
      <TabsContent value="purchases">
        <PurchasesActivitiesTab />
      </TabsContent>
    </Tabs>
  );
};

export default ActivityTabs;
