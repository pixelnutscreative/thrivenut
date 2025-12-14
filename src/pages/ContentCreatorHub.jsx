import React, { useState } from 'react';
import { useTheme } from '../components/shared/useTheme';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Target, Briefcase, TrendingUp, FileText, DollarSign, Calendar, Zap } from 'lucide-react';

// Import individual tab content components
import CreatorDashboard from './CreatorDashboard';
import Brands from './Brands';
import CampaignTimeline from './CampaignTimeline';
import ContentCards from './ContentCards';
import PromotedOffers from './PromotedOffers';
import ContentCalendar from './ContentCalendar';
import BatchMode from './BatchMode';

export default function ContentCreatorHub() {
  const { bgClass } = useTheme();
  const [activeTab, setActiveTab] = useState('dashboard');

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Target, component: CreatorDashboard },
    { id: 'brands', label: 'Brands', icon: Briefcase, component: Brands },
    { id: 'campaigns', label: 'Campaigns', icon: TrendingUp, component: CampaignTimeline },
    { id: 'offers', label: 'Offers & Sales', icon: DollarSign, component: PromotedOffers },
    { id: 'content', label: 'Content Cards', icon: FileText, component: ContentCards },
    { id: 'batch', label: 'Batch Mode', icon: Zap, component: BatchMode },
    { id: 'calendar', label: 'Calendar', icon: Calendar, component: ContentCalendar },
  ];

  return (
    <div className={`min-h-screen ${bgClass}`}>
      <div className="w-full">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="sticky top-0 z-[5] bg-white/80 backdrop-blur-sm border-b px-6 py-4">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Content Creator Center</h1>
            <TabsList className="flex w-full gap-3 justify-start overflow-x-auto">
              {tabs.map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <TabsTrigger 
                    key={tab.id} 
                    value={tab.id}
                    className="flex items-center gap-2 px-4 py-2 data-[state=active]:bg-purple-600 data-[state=active]:text-white whitespace-nowrap"
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span className={isActive ? '' : 'hidden md:inline'}>{tab.label}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </div>

          {tabs.map(tab => {
            const Component = tab.component;
            return (
              <TabsContent key={tab.id} value={tab.id} className="mt-0">
                <Component />
              </TabsContent>
            );
          })}
        </Tabs>
      </div>
    </div>
  );
}