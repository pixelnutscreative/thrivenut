import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Bell, ExternalLink, Bookmark, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../../utils';

export default function NotificationBell({ userEmail, isDark = false }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  // Fetch notifications
  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const notifs = await base44.entities.Notification.filter({ is_active: true }, '-created_date');
      
      if (!userEmail) return [];
      
      // Filter based on user's TikTok access
      const prefs = await base44.entities.UserPreferences.filter({ user_email: userEmail });
      const hasTikTokAccess = prefs[0]?.tiktok_access_approved;
      
      return notifs.filter(n => {
        if (n.target_audience === 'all') return true;
        if (n.target_audience === 'tiktok_users' && hasTikTokAccess) return true;
        return false;
      });
    },
    enabled: !!userEmail,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Fetch which notifications the user has read
  const { data: readNotifications = [] } = useQuery({
    queryKey: ['notificationReads', userEmail],
    queryFn: async () => {
      return await base44.entities.NotificationRead.filter({ user_email: userEmail });
    },
    enabled: !!userEmail,
  });

  const unreadNotifications = notifications.filter(
    n => !readNotifications.some(r => r.notification_id === n.id)
  );

  const markAsReadMutation = useMutation({
    mutationFn: (notificationId) => 
      base44.entities.NotificationRead.create({
        notification_id: notificationId,
        user_email: userEmail
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificationReads'] });
    }
  });

  const saveNotificationMutation = useMutation({
    mutationFn: (notificationId) =>
      base44.entities.NotificationSaved.create({
        notification_id: notificationId,
        user_email: userEmail
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificationReads'] });
    }
  });

  const dismissNotificationMutation = useMutation({
    mutationFn: (notificationId) =>
      base44.entities.NotificationRead.create({
        notification_id: notificationId,
        user_email: userEmail
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificationReads'] });
    }
  });

  const handleNotificationClick = (notification) => {
    markAsReadMutation.mutate(notification.id);
  };

  const handleSaveNotification = (e, notificationId) => {
    e.stopPropagation();
    saveNotificationMutation.mutate(notificationId);
  };

  const handleDismissNotification = (e, notificationId) => {
    e.stopPropagation();
    dismissNotificationMutation.mutate(notificationId);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className={`w-5 h-5 ${isDark ? 'text-gray-100' : 'text-gray-600'}`} />
          {unreadNotifications.length > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-red-500"
            >
              {unreadNotifications.length}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="font-semibold">Notifications</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setIsOpen(false);
              navigate(createPageUrl('NotificationHistory'));
            }}
          >
            View History
          </Button>
        </div>
        <div className="max-h-[500px] overflow-y-auto">
          {unreadNotifications.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Bell className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>No new notifications</p>
            </div>
          ) : (
            unreadNotifications.map((notif) => (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 border-b hover:bg-gray-50"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1">
                    <p className="font-medium text-sm mb-2">{notif.title}</p>
                    <div 
                      className="text-xs text-gray-600 prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: notif.message }}
                    />
                  </div>
                </div>
                
                {notif.button_text && notif.button_url && (
                  <Button
                    size="sm"
                    className="w-full mt-3 text-white"
                    style={{ backgroundColor: notif.button_color || '#8b5cf6' }}
                    onClick={() => {
                      handleNotificationClick(notif);
                      window.open(notif.button_url, '_blank');
                    }}
                  >
                    {notif.button_text}
                  </Button>
                )}

                <div className="flex items-center gap-2 mt-3">
                  {notif.allow_save !== false && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => handleSaveNotification(e, notif.id)}
                      disabled={saveNotificationMutation.isPending}
                    >
                      <Bookmark className="w-3 h-3 mr-1" />
                      Save
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => handleDismissNotification(e, notif.id)}
                    disabled={dismissNotificationMutation.isPending}
                  >
                    <X className="w-3 h-3 mr-1" />
                    Dismiss
                  </Button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}