import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, Bookmark, Trash2, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { getEffectiveUserEmail } from '../components/admin/ImpersonationBanner';
import { useTheme } from '../components/shared/useTheme';

export default function NotificationHistory() {
  const queryClient = useQueryClient();
  const { user, effectiveEmail, isLoading } = useTheme();

  // Fetch all active notifications
  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const notifs = await base44.entities.Notification.filter({ is_active: true }, '-created_date');
      
      if (!effectiveEmail) return [];
      
      // Filter based on user's TikTok access
      const prefs = await base44.entities.UserPreferences.filter({ user_email: effectiveEmail });
      const hasTikTokAccess = prefs[0]?.tiktok_access_approved;
      
      return notifs.filter(n => {
        if (n.target_audience === 'all') return true;
        if (n.target_audience === 'tiktok_users' && hasTikTokAccess) return true;
        if (n.target_audience === 'admin' && user?.role === 'admin') return true;
        return false;
      });
    },
    enabled: !!effectiveEmail,
  });

  // Fetch saved notifications
  const { data: savedNotifications = [] } = useQuery({
    queryKey: ['savedNotifications', effectiveEmail],
    queryFn: async () => {
      return await base44.entities.NotificationSaved.filter({ user_email: effectiveEmail });
    },
    enabled: !!effectiveEmail,
  });

  const unsaveNotificationMutation = useMutation({
    mutationFn: (savedId) => base44.entities.NotificationSaved.delete(savedId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedNotifications'] });
    }
  });

  const savedNotificationData = notifications.filter(n => 
    savedNotifications.some(s => s.notification_id === n.id)
  ).map(n => ({
    ...n,
    savedRecord: savedNotifications.find(s => s.notification_id === n.id)
  }));

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-purple-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Bell className="w-8 h-8 text-purple-600" />
          <h1 className="text-3xl font-bold text-gray-800">Notification History</h1>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="all">
              <Bell className="w-4 h-4 mr-2" />
              All Notifications
            </TabsTrigger>
            <TabsTrigger value="saved">
              <Bookmark className="w-4 h-4 mr-2" />
              Saved ({savedNotificationData.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {notifications.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Bell className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500">No notifications yet</p>
                </CardContent>
              </Card>
            ) : (
              notifications.map((notif) => (
                <motion.div
                  key={notif.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-1">{notif.title}</h3>
                          <p className="text-xs text-gray-500">
                            {format(new Date(notif.created_date), 'MMM d, yyyy • h:mm a')}
                          </p>
                        </div>
                        <Badge variant="outline">{notif.target_audience}</Badge>
                      </div>
                      
                      <div 
                        className="prose prose-sm max-w-none mb-4"
                        dangerouslySetInnerHTML={{ __html: notif.message }}
                      />

                      {notif.button_text && notif.button_url && (
                        <Button
                          size="sm"
                          className="text-white"
                          style={{ backgroundColor: notif.button_color || '#8b5cf6' }}
                          asChild
                        >
                          <a href={notif.button_url} target="_blank" rel="noopener noreferrer">
                            {notif.button_text}
                            <ExternalLink className="w-3 h-3 ml-2" />
                          </a>
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </TabsContent>

          <TabsContent value="saved" className="space-y-4">
            {savedNotificationData.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Bookmark className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500">No saved notifications</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Click "Save" on notifications to access them here later
                  </p>
                </CardContent>
              </Card>
            ) : (
              savedNotificationData.map((notif) => (
                <motion.div
                  key={notif.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Bookmark className="w-4 h-4 text-amber-500 fill-amber-500" />
                            <h3 className="font-semibold text-lg">{notif.title}</h3>
                          </div>
                          <p className="text-xs text-gray-500">
                            Saved {format(new Date(notif.savedRecord.saved_at), 'MMM d, yyyy • h:mm a')}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => unsaveNotificationMutation.mutate(notif.savedRecord.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </Button>
                      </div>
                      
                      <div 
                        className="prose prose-sm max-w-none mb-4"
                        dangerouslySetInnerHTML={{ __html: notif.message }}
                      />

                      {notif.button_text && notif.button_url && (
                        <Button
                          size="sm"
                          className="text-white"
                          style={{ backgroundColor: notif.button_color || '#8b5cf6' }}
                          asChild
                        >
                          <a href={notif.button_url} target="_blank" rel="noopener noreferrer">
                            {notif.button_text}
                            <ExternalLink className="w-3 h-3 ml-2" />
                          </a>
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}