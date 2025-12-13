import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Shield, Star, UserCog, Users, Gift, Settings, Palette, Clock, MessageSquare, ListTodo, Squirrel, FolderOpen, Merge, Mail, Menu, Sparkles, DollarSign, Award } from 'lucide-react';

// Import the individual admin components/pages as content
import AdminSuperFanContent from '../components/admin/AdminSuperFanContent';
import AdminSuperFanQueue from '../components/admin/AdminSuperFanQueue';
import AdminImpersonateContent from '../components/admin/AdminImpersonateContent';
import AdminMasterContactsContent from '../components/admin/AdminMasterContactsContent';
import AdminGiftLibraryContent from '../components/admin/AdminGiftLibraryContent';
import AdminSettingsContent from '../components/admin/AdminSettingsContent';
import AdminResourcesContent from '../components/admin/AdminResourcesContent';
import AdminSupportContent from '../components/admin/AdminSupportContent';
import AdminFeedbackContent from '../components/admin/AdminFeedbackContent';
import AdminNutPalsContent from '../components/admin/AdminNutPalsContent';
import AdminCategoriesContent from '../components/admin/AdminCategoriesContent';
import DuplicateContactMerger from '../components/admin/DuplicateContactMerger';
import AdminPreApprovedEmailsContent from '../components/admin/AdminPreApprovedEmailsContent';
import AdminMenuContent from '../components/admin/AdminMenuContent';
import AdminPixelsPlaceContent from '../components/admin/AdminPixelsPlaceContent';
import AdminAIToolsContent from '../components/admin/AdminAIToolsContent';
import AdminReferralRewardsContent from '../components/admin/AdminReferralRewardsContent';
import AdminReferralCommissionsContent from '../components/admin/AdminReferralCommissionsContent';

const ADMIN_EMAILS = ['pixelnutscreative@gmail.com', 'pixel@thrivenut.app'];

export default function Admin() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('feedback');

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const isAdmin = ADMIN_EMAILS.includes(user?.email?.toLowerCase());

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 p-4 md:p-8 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <Shield className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-gray-800">Admin Access Only</h1>
            <p className="text-gray-600 mt-2">This page is restricted to administrators.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <Shield className="w-8 h-8 text-purple-600" />
            Admin Panel
          </h1>
          <p className="text-gray-600 mt-1">Manage users, access, and app settings</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="space-y-2 mb-6">
            {/* Row 1: User & Access Management */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-gray-500 uppercase w-20">Users</span>
              <TabsList className="flex gap-1">
                <TabsTrigger value="emails" className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <span className="hidden sm:inline">Emails</span>
                </TabsTrigger>
                <TabsTrigger value="superfan" className="flex items-center gap-2">
                  <Star className="w-4 h-4" />
                  <span className="hidden sm:inline">SuperFan</span>
                </TabsTrigger>
                <TabsTrigger value="queue" className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span className="hidden sm:inline">Queue</span>
                </TabsTrigger>
                <TabsTrigger value="impersonate" className="flex items-center gap-2">
                  <UserCog className="w-4 h-4" />
                  <span className="hidden sm:inline">Impersonate</span>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Row 2: Support & Feedback */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-gray-500 uppercase w-20">Support</span>
              <TabsList className="flex gap-1">
                <TabsTrigger value="feedback" className="flex items-center gap-2">
                  <ListTodo className="w-4 h-4" />
                  <span className="hidden sm:inline">Feedback</span>
                </TabsTrigger>
                <TabsTrigger value="support" className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  <span className="hidden sm:inline">Tickets</span>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Row 3: Content & Data */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-gray-500 uppercase w-20">Content</span>
              <TabsList className="flex gap-1">
                <TabsTrigger value="contacts" className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span className="hidden sm:inline">Contacts</span>
                </TabsTrigger>
                <TabsTrigger value="duplicates" className="flex items-center gap-2">
                  <Merge className="w-4 h-4" />
                  <span className="hidden sm:inline">Duplicates</span>
                </TabsTrigger>
                <TabsTrigger value="gifts" className="flex items-center gap-2">
                  <Gift className="w-4 h-4" />
                  <span className="hidden sm:inline">Gifts</span>
                </TabsTrigger>
                <TabsTrigger value="resources" className="flex items-center gap-2">
                  <Palette className="w-4 h-4" />
                  <span className="hidden sm:inline">Resources</span>
                </TabsTrigger>
                <TabsTrigger value="nutpals" className="flex items-center gap-2">
                  <Squirrel className="w-4 h-4" />
                  <span className="hidden sm:inline">NutPals</span>
                </TabsTrigger>
                <TabsTrigger value="categories" className="flex items-center gap-2">
                  <FolderOpen className="w-4 h-4" />
                  <span className="hidden sm:inline">Categories</span>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Row 4: App Settings */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-gray-500 uppercase w-20">App</span>
              <TabsList className="flex gap-1">
                <TabsTrigger value="menu" className="flex items-center gap-2">
                  <Menu className="w-4 h-4" />
                  <span className="hidden sm:inline">Menu</span>
                </TabsTrigger>
                <TabsTrigger value="pixelsplace" className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  <span className="hidden sm:inline">Pixel's Place</span>
                </TabsTrigger>
                <TabsTrigger value="aitools" className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  <span className="hidden sm:inline">AI Tools</span>
                </TabsTrigger>
                <TabsTrigger value="settings" className="flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  <span className="hidden sm:inline">Settings</span>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Row 5: Referral System */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-gray-500 uppercase w-20">Referrals</span>
              <TabsList className="flex gap-1">
                <TabsTrigger value="rewards" className="flex items-center gap-2">
                  <Award className="w-4 h-4" />
                  <span className="hidden sm:inline">Thrive Rewards</span>
                </TabsTrigger>
                <TabsTrigger value="commissions" className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  <span className="hidden sm:inline">AI Commissions</span>
                </TabsTrigger>
              </TabsList>
            </div>
          </div>

          <TabsContent value="emails" className="mt-6">
            <AdminPreApprovedEmailsContent />
          </TabsContent>

          <TabsContent value="feedback" className="mt-6">
            <AdminFeedbackContent />
          </TabsContent>

          <TabsContent value="support" className="mt-6">
            <AdminSupportContent />
          </TabsContent>

          <TabsContent value="queue" className="mt-6">
            <AdminSuperFanQueue />
          </TabsContent>

          <TabsContent value="superfan" className="mt-6">
            <AdminSuperFanContent />
          </TabsContent>

          <TabsContent value="impersonate" className="mt-6">
            <AdminImpersonateContent />
          </TabsContent>

          <TabsContent value="contacts" className="mt-6">
            <AdminMasterContactsContent />
          </TabsContent>

          <TabsContent value="duplicates" className="mt-6">
            <DuplicateContactMerger />
          </TabsContent>

          <TabsContent value="gifts" className="mt-6">
            <AdminGiftLibraryContent />
          </TabsContent>

          <TabsContent value="resources" className="mt-6">
            <AdminResourcesContent />
          </TabsContent>

          <TabsContent value="nutpals" className="mt-6">
            <AdminNutPalsContent />
          </TabsContent>

          <TabsContent value="categories" className="mt-6">
            <AdminCategoriesContent />
          </TabsContent>

          <TabsContent value="menu" className="mt-6">
            <AdminMenuContent />
          </TabsContent>

          <TabsContent value="pixelsplace" className="mt-6">
            <AdminPixelsPlaceContent />
          </TabsContent>

          <TabsContent value="aitools" className="mt-6">
            <AdminAIToolsContent />
          </TabsContent>

          <TabsContent value="settings" className="mt-6">
            <AdminSettingsContent />
          </TabsContent>

          <TabsContent value="rewards" className="mt-6">
            <AdminReferralRewardsContent />
          </TabsContent>

          <TabsContent value="commissions" className="mt-6">
            <AdminReferralCommissionsContent />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}