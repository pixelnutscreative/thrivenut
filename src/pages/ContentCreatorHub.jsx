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
    { id: 'content', label: 'Content Cards', icon: FileText, component: ContentCards },
    { id: 'offers', label: 'Offers & Sales', icon: DollarSign, component: PromotedOffers },
    { id: 'calendar', label: 'Calendar', icon: Calendar, component: ContentCalendar },
    { id: 'batch', label: 'Batch Mode', icon: Zap, component: BatchMode },
  ];

  return (
    <div className={`min-h-screen ${bgClass}`}>
      <div className="max-w-[1800px] mx-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b px-6 py-4">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Content Creator Center</h1>
            <TabsList className="grid w-full grid-cols-7 gap-2">
              {tabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <TabsTrigger 
                    key={tab.id} 
                    value={tab.id}
                    className="flex items-center gap-2 data-[state=active]:bg-purple-600 data-[state=active]:text-white"
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden md:inline">{tab.label}</span>
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