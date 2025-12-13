import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';

export default function NotificationBell({ userEmail, isDark }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', userEmail],
    queryFn: async () => {
      try {
        const all = await base44.entities.Notification.filter({ is_active: true }, '-created_date');
        return all;
      } catch (error) {
        console.error('Error fetching notifications:', error);
        return [];
      }
    },
    enabled: !!userEmail,
    retry: false,
  });

  const { data: readNotifications = [] } = useQuery({
    queryKey: ['notificationReads', userEmail],
    queryFn: () => base44.entities.NotificationRead.filter({ user_email: userEmail }),
    enabled: !!userEmail,
  });

  const markAsReadMutation = useMutation({
    mutationFn: (notificationId) => 
      base44.entities.NotificationRead.create({
        notification_id: notificationId,
        user_email: userEmail,
        read_at: new Date().toISOString()
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificationReads'] });
    },
  });

  const readIds = readNotifications.map(r => r.notification_id);
  const unreadCount = notifications.filter(n => !readIds.includes(n.id)).length;

  const handleNotificationClick = (notification) => {
    if (!readIds.includes(notification.id)) {
      markAsReadMutation.mutate(notification.id);
    }
    if (notification.link) {
      window.open(notification.link, '_blank');
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className={`relative ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-red-600 text-white text-xs">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 border-b">
          <h3 className="font-semibold">Notifications</h3>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-500">
              No notifications
            </div>
          ) : (
            notifications.map(notification => {
              const isRead = readIds.includes(notification.id);
              return (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-4 border-b cursor-pointer transition-colors ${
                    isRead ? 'bg-white hover:bg-gray-50' : 'bg-blue-50 hover:bg-blue-100'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{notification.title}</p>
                      <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                      <p className="text-xs text-gray-400 mt-2">
                        {format(new Date(notification.created_date), 'MMM d, h:mm a')}
                      </p>
                    </div>
                    {!isRead && <div className="w-2 h-2 bg-blue-600 rounded-full ml-2" />}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}