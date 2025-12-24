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
import AdminContentReview from '../components/admin/AdminContentReview';
import DuplicateContactMerger from '../components/admin/DuplicateContactMerger';
import AdminPreApprovedEmailsContent from '../components/admin/AdminPreApprovedEmailsContent';
import AdminUserPermissions from '../components/admin/AdminUserPermissions';
import AdminDuplicateCleanup from '../components/admin/AdminDuplicateCleanup';
import AdminMenuContent from '../components/admin/AdminMenuContent';
import AdminPixelsPlaceContent from '../components/admin/AdminPixelsPlaceContent';
import AdminAIToolsContent from '../components/admin/AdminAIToolsContent';
import AdminReferralSystem from '../components/admin/AdminReferralSystem';
import AdminReferralCommissionsContent from '../components/admin/AdminReferralCommissionsContent';
import AdminNotificationsContent from '../components/admin/AdminNotificationsContent';
import AdminHomepageFeatures from '../components/admin/AdminHomepageFeatures';
import AdminGroupsContent from '../components/admin/AdminGroupsContent.jsx';
import AdminGroupTypesContent from '../components/admin/AdminGroupTypesContent.jsx';
import AdminAnnouncementsContent from '../components/admin/AdminAnnouncementsContent';
import AdminBibleContent from '../components/admin/AdminBibleContent';
import AdminMentalHealthContent from '../components/admin/AdminMentalHealthContent';
import AdminMarketingAssets from '../components/admin/AdminMarketingAssets';
import AdminPackagesContent from '../components/admin/AdminPackagesContent';

const ADMIN_EMAILS = ['pixelnutscreative@gmail.com', 'pixel@thrivenut.app'];

export default function Admin() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('users');

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
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <Shield className="w-8 h-8 text-purple-600" />
            Admin Panel
          </h1>
          <p className="text-gray-600 mt-1">Manage users, access, and app settings</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 h-12 mb-8">
            <TabsTrigger value="users" className="text-sm font-semibold">Users</TabsTrigger>
            <TabsTrigger value="support" className="text-sm font-semibold">Support</TabsTrigger>
            <TabsTrigger value="content" className="text-sm font-semibold">Content</TabsTrigger>
            <TabsTrigger value="billing" className="text-sm font-semibold">Billing</TabsTrigger>
            <TabsTrigger value="app" className="text-sm font-semibold">App</TabsTrigger>
            <TabsTrigger value="referrals" className="text-sm font-semibold">Referrals</TabsTrigger>
          </TabsList>

          {/* USERS TAB */}
          <TabsContent value="users" className="mt-0">
            <Card>
              <CardContent className="p-6">
                <Tabs defaultValue="emails" className="w-full">
                  <div className="border-b pb-4 mb-6 overflow-x-auto">
                    <TabsList>
                      <TabsTrigger value="emails">Emails</TabsTrigger>
                      <TabsTrigger value="permissions">Permissions</TabsTrigger>
                      <TabsTrigger value="superfan">SuperFan</TabsTrigger>
                      <TabsTrigger value="queue">Queue</TabsTrigger>
                      <TabsTrigger value="cleanup">Cleanup</TabsTrigger>
                      <TabsTrigger value="impersonate">Impersonate</TabsTrigger>
                    </TabsList>
                  </div>
                  
                  <TabsContent value="emails"><AdminPreApprovedEmailsContent /></TabsContent>
                  <TabsContent value="permissions"><AdminUserPermissions /></TabsContent>
                  <TabsContent value="superfan"><AdminSuperFanContent /></TabsContent>
                  <TabsContent value="queue"><AdminSuperFanQueue /></TabsContent>
                  <TabsContent value="cleanup"><AdminDuplicateCleanup /></TabsContent>
                  <TabsContent value="impersonate"><AdminImpersonateContent /></TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>

          {/* SUPPORT TAB */}
          <TabsContent value="support" className="mt-0">
            <Card>
              <CardContent className="p-6">
                <Tabs defaultValue="support" className="w-full">
                  <div className="border-b pb-4 mb-6 overflow-x-auto">
                    <TabsList>
                      <TabsTrigger value="support">Tickets</TabsTrigger>
                      <TabsTrigger value="feedback">Feedback</TabsTrigger>
                    </TabsList>
                  </div>
                  
                  <TabsContent value="support"><AdminSupportContent /></TabsContent>
                  <TabsContent value="feedback"><AdminFeedbackContent /></TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>

          {/* CONTENT TAB */}
          <TabsContent value="content" className="mt-0">
            <Card>
              <CardContent className="p-6">
                <Tabs defaultValue="contacts" className="w-full">
                  <div className="border-b pb-4 mb-6 overflow-x-auto">
                    <TabsList className="flex-wrap h-auto gap-2">
                      <TabsTrigger value="contacts">Master Contacts</TabsTrigger>
                      <TabsTrigger value="duplicates">Duplicates</TabsTrigger>
                      <TabsTrigger value="gifts">Gifts</TabsTrigger>
                      <TabsTrigger value="resources">Resources</TabsTrigger>
                      <TabsTrigger value="nutpals">NutPals</TabsTrigger>
                      <TabsTrigger value="showcase">Showcase</TabsTrigger>
                      <TabsTrigger value="categories">Categories</TabsTrigger>
                      <TabsTrigger value="mentalhealth">Mental Health</TabsTrigger>
                      <TabsTrigger value="assets">Marketing Assets</TabsTrigger>
                    </TabsList>
                  </div>
                  
                  <TabsContent value="contacts"><AdminMasterContactsContent /></TabsContent>
                  <TabsContent value="duplicates"><DuplicateContactMerger /></TabsContent>
                  <TabsContent value="gifts"><AdminGiftLibraryContent /></TabsContent>
                  <TabsContent value="resources"><AdminResourcesContent /></TabsContent>
                  <TabsContent value="nutpals"><AdminNutPalsContent /></TabsContent>
                  <TabsContent value="showcase"><AdminContentReview /></TabsContent>
                  <TabsContent value="categories"><AdminCategoriesContent /></TabsContent>
                  <TabsContent value="mentalhealth"><AdminMentalHealthContent /></TabsContent>
                  <TabsContent value="assets"><AdminMarketingAssets /></TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>

          {/* BILLING TAB */}
          <TabsContent value="billing" className="mt-0">
            <Card>
              <CardContent className="p-6">
                <AdminPackagesContent />
              </CardContent>
            </Card>
          </TabsContent>

          {/* APP TAB */}
          <TabsContent value="app" className="mt-0">
            <Card>
              <CardContent className="p-6">
                <Tabs defaultValue="settings" className="w-full">
                  <div className="border-b pb-4 mb-6 overflow-x-auto">
                    <TabsList className="flex-wrap h-auto gap-2">
                      <TabsTrigger value="settings">General Settings</TabsTrigger>
                      <TabsTrigger value="menu">Menu</TabsTrigger>
                      <TabsTrigger value="pixelsplace">Pixel's Place</TabsTrigger>
                      <TabsTrigger value="aitools">AI Tools</TabsTrigger>
                      <TabsTrigger value="bible">Bible Resources</TabsTrigger>
                      <TabsTrigger value="notifications">Notifications</TabsTrigger>
                      <TabsTrigger value="announcements">Announcements</TabsTrigger>
                      <TabsTrigger value="groups">Groups</TabsTrigger>
<TabsTrigger value="groupTypes">Group Types</TabsTrigger>
                    </TabsList>
                  </div>
                  
                  <TabsContent value="settings"><AdminSettingsContent /></TabsContent>
                  <TabsContent value="menu"><AdminMenuContent /></TabsContent>
                  <TabsContent value="pixelsplace"><AdminPixelsPlaceContent /></TabsContent>
                  <TabsContent value="aitools"><AdminAIToolsContent /></TabsContent>
                  <TabsContent value="bible"><AdminBibleContent /></TabsContent>
                  <TabsContent value="notifications"><AdminNotificationsContent userEmail={user?.email} /></TabsContent>
                  <TabsContent value="announcements"><AdminAnnouncementsContent /></TabsContent>
                  <TabsContent value="groups"><AdminGroupsContent /></TabsContent>
<TabsContent value="groupTypes"><AdminGroupTypesContent /></TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>

          {/* REFERRALS TAB */}
          <TabsContent value="referrals" className="mt-0">
            <Card>
              <CardContent className="p-6">
                <Tabs defaultValue="rewards" className="w-full">
                  <div className="border-b pb-4 mb-6 overflow-x-auto">
                    <TabsList>
                      <TabsTrigger value="rewards">Thrive System</TabsTrigger>
                      <TabsTrigger value="commissions">AI Commissions</TabsTrigger>
                    </TabsList>
                  </div>
                  
                  <TabsContent value="rewards"><AdminReferralSystem /></TabsContent>
                  <TabsContent value="commissions"><AdminReferralCommissionsContent /></TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}