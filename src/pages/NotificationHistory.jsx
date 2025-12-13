import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { useTheme } from '../components/shared/useTheme';

export default function NotificationHistory() {
  const queryClient = useQueryClient();
  const { user, effectiveEmail, bgClass, primaryColor, accentColor } = useTheme();

  const { data: notifications = [] } = useQuery({
    queryKey: ['userNotifications', effectiveEmail],
    queryFn: async () => {
      const all = await base44.entities.Notification.filter({ is_active: true }, '-created_date');
      return all;
    },
    enabled: !!effectiveEmail,
  });

  const { data: readNotifications = [] } = useQuery({
    queryKey: ['notificationReads', effectiveEmail],
    queryFn: () => base44.entities.NotificationRead.filter({ user_email: effectiveEmail }),
    enabled: !!effectiveEmail,
  });

  const deleteReadMutation = useMutation({
    mutationFn: (readId) => base44.entities.NotificationRead.delete(readId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificationReads'] });
    },
  });

  const readIds = readNotifications.map(r => r.notification_id);
  const unreadNotifications = notifications.filter(n => !readIds.includes(n.id));
  const readNotificationData = notifications.filter(n => readIds.includes(n.id));

  const handleDeleteRead = (notificationId) => {
    const readRecord = readNotifications.find(r => r.notification_id === notificationId);
    if (readRecord) {
      deleteReadMutation.mutate(readRecord.id);
    }
  };

  return (
    <div className={`min-h-screen ${bgClass} p-6`}>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Notification History</h1>
          <p className="text-gray-600 mt-1">View and manage your notifications</p>
        </div>

        {/* Unread Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Unread Notifications</span>
              <Badge style={{ background: `linear-gradient(to right, ${primaryColor}, ${accentColor})` }} className="text-white">
                {unreadNotifications.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {unreadNotifications.length === 0 ? (
              <p className="text-center text-gray-500 py-4">No unread notifications</p>
            ) : (
              unreadNotifications.map(notification => (
                <div key={notification.id} className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-800">{notification.title}</h3>
                        <div className="w-2 h-2 bg-blue-600 rounded-full" />
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                      <p className="text-xs text-gray-400 mt-2">
                        {format(new Date(notification.created_date), 'MMM d, yyyy - h:mm a')}
                      </p>
                    </div>
                    {notification.link && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => window.open(notification.link, '_blank')}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Read Notifications */}
        <Card>
          <CardHeader>
            <CardTitle>Read Notifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {readNotificationData.length === 0 ? (
              <p className="text-center text-gray-500 py-4">No read notifications</p>
            ) : (
              readNotificationData.map(notification => (
                <div key={notification.id} className="p-4 bg-white border border-gray-200 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-700">{notification.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                      <p className="text-xs text-gray-400 mt-2">
                        {format(new Date(notification.created_date), 'MMM d, yyyy - h:mm a')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {notification.link && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => window.open(notification.link, '_blank')}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteRead(notification.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}