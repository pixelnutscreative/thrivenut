import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, FileText, CheckSquare, Wrench, Share2 } from 'lucide-react';
import AdminCampaignTypesContent from '../components/admin/AdminCampaignTypesContent';
import AdminWorkflowStepsContent from '../components/admin/AdminWorkflowStepsContent';
import AdminChecklistsContent from '../components/admin/AdminChecklistsContent';
import AdminToolsContent from '../components/admin/AdminToolsContent';
import AdminPlatformsContent from '../components/admin/AdminPlatformsContent';

export default function PromotionEngine() {
  const [activeTab, setActiveTab] = useState('campaign-types');

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-purple-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-teal-600 to-purple-600 bg-clip-text text-transparent mb-2">
            THRIVE - Promotion Engine
          </h1>
          <p className="text-gray-600">Admin Configuration - V1</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-5 w-full mb-6">
            <TabsTrigger value="campaign-types">
              <Settings className="w-4 h-4 mr-2" />
              Campaign Types
            </TabsTrigger>
            <TabsTrigger value="platforms">
              <Share2 className="w-4 h-4 mr-2" />
              Platforms
            </TabsTrigger>
            <TabsTrigger value="workflow-steps">
              <FileText className="w-4 h-4 mr-2" />
              Workflow Steps
            </TabsTrigger>
            <TabsTrigger value="checklists">
              <CheckSquare className="w-4 h-4 mr-2" />
              Checklists
            </TabsTrigger>
            <TabsTrigger value="tools">
              <Wrench className="w-4 h-4 mr-2" />
              Tools
            </TabsTrigger>
          </TabsList>

          <TabsContent value="campaign-types">
            <AdminCampaignTypesContent />
          </TabsContent>

          <TabsContent value="platforms">
            <AdminPlatformsContent />
          </TabsContent>

          <TabsContent value="workflow-steps">
            <AdminWorkflowStepsContent />
          </TabsContent>

          <TabsContent value="checklists">
            <AdminChecklistsContent />
          </TabsContent>

          <TabsContent value="tools">
            <AdminToolsContent />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}