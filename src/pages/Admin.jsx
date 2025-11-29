import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Shield, Star, UserCog, Users, Gift, Settings, Palette, Clock } from 'lucide-react';

// Import the individual admin components/pages as content
import AdminSuperFanContent from '../components/admin/AdminSuperFanContent';
import AdminSuperFanQueue from '../components/admin/AdminSuperFanQueue';
import AdminImpersonateContent from '../components/admin/AdminImpersonateContent';
import AdminMasterContactsContent from '../components/admin/AdminMasterContactsContent';
import AdminGiftLibraryContent from '../components/admin/AdminGiftLibraryContent';
import AdminSettingsContent from '../components/admin/AdminSettingsContent';
import AdminResourcesContent from '../components/admin/AdminResourcesContent';

const ADMIN_EMAIL = 'pixelnutscreative@gmail.com';

export default function Admin() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('superfan');

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const isAdmin = user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

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
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="queue" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span className="hidden sm:inline">Queue</span>
            </TabsTrigger>
            <TabsTrigger value="superfan" className="flex items-center gap-2">
              <Star className="w-4 h-4" />
              <span className="hidden sm:inline">SuperFan</span>
            </TabsTrigger>
            <TabsTrigger value="impersonate" className="flex items-center gap-2">
              <UserCog className="w-4 h-4" />
              <span className="hidden sm:inline">Users</span>
            </TabsTrigger>
            <TabsTrigger value="contacts" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Contacts</span>
            </TabsTrigger>
            <TabsTrigger value="gifts" className="flex items-center gap-2">
              <Gift className="w-4 h-4" />
              <span className="hidden sm:inline">Gifts</span>
            </TabsTrigger>
            <TabsTrigger value="resources" className="flex items-center gap-2">
              <Palette className="w-4 h-4" />
              <span className="hidden sm:inline">Resources</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Settings</span>
            </TabsTrigger>
          </TabsList>

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

          <TabsContent value="gifts" className="mt-6">
            <AdminGiftLibraryContent />
          </TabsContent>

          <TabsContent value="resources" className="mt-6">
            <AdminResourcesContent />
          </TabsContent>

          <TabsContent value="settings" className="mt-6">
            <AdminSettingsContent />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}