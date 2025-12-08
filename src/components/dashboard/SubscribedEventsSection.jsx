import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bell, BellOff, Calendar, Clock, Video, Gift, Star, MapPin, Users, ExternalLink } from 'lucide-react';
import { format, parseISO, isSameDay, isAfter, addMinutes } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

export default function SubscribedEventsSection({ userEmail, primaryColor }) {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [eventNotifications, setEventNotifications] = useState({});

  // Check browser notification permission on mount
  useEffect(() => {
    if ('Notification' in window) {
      setNotificationsEnabled(Notification.permission === 'granted');
    }
  }, []);

  // Fetch all ContentCalendarItems that are shared to directory
  const { data: allEvents = [] } = useQuery({
    queryKey: ['publicEvents'],
    queryFn: async () => {
      const events = await base44.entities.ContentCalendarItem.filter({ 
        share_to_directory: true 
      }, 'day_of_week,time');
      return events;
    },
  });

  // Fetch user's subscriptions (LiveReminderSignup tracks which creators they follow)
  const { data: subscriptions = [] } = useQuery({
    queryKey: ['mySubscriptions', userEmail],
    queryFn: async () => {
      // For now, show all public events - we can filter by subscriptions later
      return [];
    },
    enabled: !!userEmail,
  });

  // Get creator contacts for event owners
  const { data: creatorContacts = [] } = useQuery({
    queryKey: ['creatorContacts'],
    queryFn: () => base44.entities.TikTokContact.list(),
  });

  // Get today's events
  const today = new Date();
  const todaysEvents = allEvents.filter(event => {
    // For recurring events, check if it matches today's day of week
    if (event.is_recurring) {
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const todayName = dayNames[today.getDay()];
      return event.day_of_week === todayName;
    }
    
    // For specific dates
    if (event.specific_date) {
      return isSameDay(parseISO(event.specific_date), today);
    }
    
    return false;
  });

  // Request browser notification permission
  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotificationsEnabled(permission === 'granted');
      if (permission === 'granted') {
        new Notification('Notifications Enabled!', {
          body: "You'll get reminders for upcoming creator events",
          icon: '/logo.png'
        });
      }
    }
  };

  // Toggle notification for specific event
  const toggleEventNotification = (eventId) => {
    setEventNotifications(prev => ({
      ...prev,
      [eventId]: !prev[eventId]
    }));
    
    // Store in localStorage
    localStorage.setItem(`notify_event_${eventId}`, !eventNotifications[eventId] ? 'true' : 'false');
  };

  // Load notification preferences from localStorage
  useEffect(() => {
    const loadedPrefs = {};
    todaysEvents.forEach(event => {
      const stored = localStorage.getItem(`notify_event_${event.id}`);
      if (stored === 'true') {
        loadedPrefs[event.id] = true;
      }
    });
    setEventNotifications(loadedPrefs);
  }, [todaysEvents.length]);

  // Check for upcoming events and send notifications
  useEffect(() => {
    if (!notificationsEnabled) return;

    const checkUpcoming = () => {
      const now = new Date();
      
      todaysEvents.forEach(event => {
        if (!eventNotifications[event.id]) return;
        
        // Parse event time
        const [time, period] = event.time.split(' ');
        let [hours, minutes] = time.split(':').map(Number);
        if (period === 'PM' && hours !== 12) hours += 12;
        if (period === 'AM' && hours === 12) hours = 0;
        
        const eventTime = new Date(now);
        eventTime.setHours(hours, minutes, 0, 0);
        
        // Check if event is 15 minutes away
        const fifteenMinutesBefore = addMinutes(eventTime, -15);
        const timeDiff = fifteenMinutesBefore.getTime() - now.getTime();
        
        // If within 1 minute of 15-min warning
        if (timeDiff > 0 && timeDiff < 60000) {
          const creator = creatorContacts.find(c => c.created_by === event.created_by);
          const creatorName = creator?.display_name || creator?.username || 'A creator';
          
          new Notification(`${creatorName} going live soon!`, {
            body: `${event.title} starts in 15 minutes at ${event.time}`,
            icon: creator?.image_url || '/logo.png',
            tag: `event_${event.id}`,
            requireInteraction: true
          });
        }
      });
    };

    // Check every minute
    const interval = setInterval(checkUpcoming, 60000);
    checkUpcoming(); // Check immediately

    return () => clearInterval(interval);
  }, [notificationsEnabled, eventNotifications, todaysEvents, creatorContacts]);

  // Get event type icon and color
  const getEventTypeInfo = (event) => {
    const isBattle = event.live_types?.includes('battle');
    const hasGiveaway = event.has_giveaway;
    
    if (isBattle) return { icon: Users, color: 'text-red-500', bg: 'bg-red-50', label: 'Battle' };
    if (hasGiveaway) return { icon: Gift, color: 'text-purple-500', bg: 'bg-purple-50', label: 'Giveaway' };
    if (event.type === 'live') return { icon: Video, color: 'text-blue-500', bg: 'bg-blue-50', label: 'Live' };
    return { icon: Calendar, color: 'text-green-500', bg: 'bg-green-50', label: 'Event' };
  };

  if (todaysEvents.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Video className="w-5 h-5" style={{ color: primaryColor }} />
            Today's Creator Events
          </CardTitle>
          {!notificationsEnabled ? (
            <Button
              size="sm"
              variant="outline"
              onClick={requestNotificationPermission}
              className="flex items-center gap-2"
            >
              <Bell className="w-4 h-4" />
              Enable Alerts
            </Button>
          ) : (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Bell className="w-3 h-3" />
              Alerts On
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <AnimatePresence>
          <div className="space-y-3">
            {todaysEvents.map((event, idx) => {
              const typeInfo = getEventTypeInfo(event);
              const Icon = typeInfo.icon;
              const creator = creatorContacts.find(c => c.created_by === event.created_by);
              const hasNotification = eventNotifications[event.id];

              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`p-4 rounded-xl border-2 ${typeInfo.bg} border-gray-200 hover:shadow-md transition-all`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`w-10 h-10 rounded-lg ${typeInfo.bg} flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`w-5 h-5 ${typeInfo.color}`} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {creator?.image_url && (
                            <img 
                              src={creator.image_url} 
                              alt={creator.display_name}
                              className="w-6 h-6 rounded-full object-cover"
                            />
                          )}
                          <span className="font-semibold text-sm text-gray-700">
                            {creator?.display_name || creator?.username || 'Creator'}
                          </span>
                          <Badge variant="secondary" className="text-xs">{typeInfo.label}</Badge>
                        </div>
                        
                        <h4 className="font-semibold text-gray-900 mb-1">{event.title}</h4>
                        
                        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {event.time}
                          </div>
                          
                          {event.platforms && event.platforms.length > 0 && (
                            <div className="flex items-center gap-1">
                              <Video className="w-4 h-4" />
                              {event.platforms.join(', ')}
                            </div>
                          )}
                          
                          {event.is_in_person && (
                            <div className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {event.city}, {event.state}
                            </div>
                          )}

                          {event.has_giveaway && (
                            <Badge className="bg-purple-100 text-purple-800 text-xs">
                              <Gift className="w-3 h-3 mr-1" />
                              Giveaway
                            </Badge>
                          )}
                          
                          {event.superfan_only && (
                            <Badge className="bg-amber-100 text-amber-800 text-xs">
                              <Star className="w-3 h-3 mr-1" />
                              SuperFan Only
                            </Badge>
                          )}
                        </div>

                        {event.stream_url && (
                          <a 
                            href={event.stream_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 mt-2"
                          >
                            Join Stream <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>

                    {notificationsEnabled && (
                      <Button
                        size="icon"
                        variant={hasNotification ? 'default' : 'outline'}
                        onClick={() => toggleEventNotification(event.id)}
                        className={hasNotification ? '' : 'text-gray-400'}
                        title={hasNotification ? 'Notifications on' : 'Notifications off'}
                      >
                        {hasNotification ? (
                          <Bell className="w-4 h-4" />
                        ) : (
                          <BellOff className="w-4 h-4" />
                        )}
                      </Button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </AnimatePresence>

        {todaysEvents.length > 0 && notificationsEnabled && (
          <p className="text-xs text-gray-500 mt-4 text-center">
            Click the bell icon to get a reminder 15 minutes before an event starts
          </p>
        )}
      </CardContent>
    </Card>
  );
}