import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [currentUserEmail, setCurrentUserEmail] = useState(null);
  const [localPreferences, setLocalPreferences] = useState({ 
    user_email: currentUserEmail || '' 
  });

  // Get current user
  useEffect(() => {
    base44.auth.me().then(user => {
      if (user?.email) setCurrentUserEmail(user.email);
    });
  }, []);

  // Load settings
  const { data: userPreferences, isLoading } = useQuery({
    queryKey: ['userPreferences', currentUserEmail],
    queryFn: async () => {
      if (!currentUserEmail) return null;
      const prefs = await base44.entities.UserPreferences.filter({ user_email: currentUserEmail });
      return prefs[0] || null;
    },
    enabled: !!currentUserEmail,
    onSuccess: (data) => {
      if (data) {
        setLocalPreferences(data);
      } else {
        // First-time user defaults
        setLocalPreferences({
          user_email: currentUserEmail || '',
          nickname: '',
          user_timezone: 'UTC',
          default_landing_page: 'Dashboard',
          hide_quick_action_labels: false,
        });
      }
    }
  });

  // Save settings
  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (!currentUserEmail) throw new Error("No user email");
      
      if (userPreferences?.id) {
        return base44.entities.UserPreferences.update(userPreferences.id, data);
      } else {
        return base44.entities.UserPreferences.create({ ...data, user_email: currentUserEmail });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['userPreferences', currentUserEmail]);
      toast.success("Settings saved!");
    },
    onError: (err) => {
      toast.error(`Save failed: ${err.message}`);
    }
  });

  const handleSave = () => {
    saveMutation.mutate(localPreferences);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>
      
      <Tabs defaultValue="preferences" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="customize">Customize</TabsTrigger>
        </TabsList>

        {/* PREFERENCES TAB */}
        <TabsContent value="preferences" className="space-y-4">
          <div>
            <Label className="block mb-2">Nickname</Label>
            <Input
              placeholder="Enter nickname"
              value={localPreferences.nickname || ''}
              onChange={(e) => setLocalPreferences(prev => ({ ...prev, nickname: e.target.value }))}
            />
          </div>
          <div>
            <Label className="block mb-2">Timezone</Label>
            <select 
              className="w-full p-2 border rounded"
              value={localPreferences.user_timezone || 'UTC'}
              onChange={(e) => setLocalPreferences(prev => ({ ...prev, user_timezone: e.target.value }))}
            >
              <option value="UTC">UTC</option>
              <option value="America/New_York">Eastern Time</option>
              <option value="America/Los_Angeles">Pacific Time</option>
            </select>
          </div>
          <div>
            <Label className="block mb-2">Default Landing Page</Label>
            <select 
              className="w-full p-2 border rounded"
              value={localPreferences.default_landing_page || 'Dashboard'}
              onChange={(e) => setLocalPreferences(prev => ({ ...prev, default_landing_page: e.target.value }))}
            >
              <option value="Dashboard">Dashboard</option>
              <option value="Home">Home</option>
              <option value="Profile">Profile</option>
            </select>
          </div>
        </TabsContent>

        {/* DASHBOARD TAB */}
        <TabsContent value="dashboard" className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded">
            <Label>Hide Quick Action Labels</Label>
            <Switch
              checked={localPreferences.hide_quick_action_labels || false}
              onCheckedChange={(checked) => setLocalPreferences(prev => ({ ...prev, hide_quick_action_labels: checked }))}
            />
          </div>
        </TabsContent>

        {/* CUSTOMIZE TAB */}
        <TabsContent value="customize" className="space-y-4">
          <div>
            <Label className="block mb-2">Primary Color</Label>
            <Input
              type="color"
              value={localPreferences.primary_color || '#1fd2ea'}
              onChange={(e) => setLocalPreferences(prev => ({ ...prev, primary_color: e.target.value }))}
            />
          </div>
        </TabsContent>
      </Tabs>

      <Button 
        onClick={handleSave} 
        className="mt-6" 
        disabled={saveMutation.isPending}
      >
        {saveMutation.isPending ? 'Saving...' : 'Save All Settings'}
      </Button>
    </div>
  );
}