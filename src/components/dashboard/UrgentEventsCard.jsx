import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Calendar, Clock, ExternalLink, Swords, Video, Users, GraduationCap, Zap } from 'lucide-react';
import { format, parseISO, isToday, isTomorrow } from 'date-fns';
import { motion } from 'framer-motion';

const platformIcons = {
  TikTok: Video,
  Instagram: Video,
  Discord: Users,
  YouTube: Video,
  Zoom: Users,
  Other: Calendar
};

const eventTypeDetector = (title, notes) => {
  const text = `${title} ${notes}`.toLowerCase();
  if (text.includes('battle') || text.includes('box battle')) return { icon: Swords, color: 'from-red-500 to-rose-600', label: 'Battle' };
  if (text.includes('training') || text.includes('class') || text.includes('workshop') || text.includes('learn')) return { icon: GraduationCap, color: 'from-blue-500 to-indigo-600', label: 'Training' };
  if (text.includes('collab') || text.includes('co-host')) return { icon: Users, color: 'from-purple-500 to-pink-600', label: 'Collab' };
  return { icon: Calendar, color: 'from-amber-500 to-orange-600', label: 'Event' };
};

export default function UrgentEventsCard({ events, publicCalendarEvents }) {
  if (!events || events.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6"
    >
      <Card className="border-4 border-red-500 shadow-2xl bg-gradient-to-r from-red-50 via-orange-50 to-amber-50">
        <CardHeader className="bg-gradient-to-r from-red-600 to-rose-600 text-white pb-3">
          <CardTitle className="flex items-center gap-2 text-xl">
            <AlertTriangle className="w-6 h-6 animate-pulse" />
            🔥 Today's Important Events - DO NOT MISS!
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-3">
          {events.map((event, idx) => {
            const eventDate = parseISO(event.date);
            const isEventToday = isToday(eventDate);
            const isEventTomorrow = isTomorrow(eventDate);
            const eventType = eventTypeDetector(event.title, event.notes || '');
            const EventIcon = eventType.icon;
            const PlatformIcon = platformIcons[event.platform] || Calendar;

            return (
              <motion.div
                key={event.id || idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="p-4 bg-white rounded-xl border-2 border-red-200 shadow-md hover:shadow-lg transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${eventType.color} flex items-center justify-center flex-shrink-0`}>
                      <EventIcon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-bold text-gray-900 text-lg">{event.title}</h3>
                        {isEventToday && (
                          <Badge className="bg-red-600 text-white animate-pulse">TODAY</Badge>
                        )}
                        {isEventTomorrow && (
                          <Badge className="bg-orange-600 text-white">TOMORROW</Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-3 text-sm text-gray-600 mb-2 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(eventDate, 'EEE, MMM d')}
                        </span>
                        {event.time && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {event.time}
                          </span>
                        )}
                        {event.platform && (
                          <Badge variant="outline" className="text-xs">
                            <PlatformIcon className="w-3 h-3 mr-1" />
                            {event.platform}
                          </Badge>
                        )}
                      </div>

                      {event.host_username && (
                        <p className="text-sm text-gray-700 mb-1">
                          <span className="font-medium">Host:</span> @{event.host_username}
                        </p>
                      )}

                      {event.notes && (
                        <p className="text-sm text-gray-600 italic">{event.notes}</p>
                      )}
                    </div>
                  </div>

                  {event.link && (
                    <Button
                      size="sm"
                      onClick={() => window.open(event.link, '_blank')}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 flex-shrink-0"
                    >
                      <ExternalLink className="w-4 h-4 mr-1" />
                      Join
                    </Button>
                  )}
                </div>
              </motion.div>
            );
          })}

          {/* Public Calendar Events */}
          {publicCalendarEvents && publicCalendarEvents.length > 0 && (
            <>
              <div className="border-t-2 border-orange-200 pt-3 mt-3">
                <p className="text-sm font-semibold text-orange-800 mb-2 flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Pixel Nuts Events
                </p>
              </div>
              {publicCalendarEvents.map((event, idx) => (
                <motion.div
                  key={`pub-${idx}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: (events.length + idx) * 0.1 }}
                  className="p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200"
                >
                  <h4 className="font-semibold text-gray-900">{event.summary}</h4>
                  <div className="flex items-center gap-3 text-xs text-gray-600 mt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {event.start}
                    </span>
                  </div>
                  {event.description && (
                    <p className="text-xs text-gray-600 mt-1">{event.description}</p>
                  )}
                  {event.location && (
                    <a href={event.location} target="_blank" rel="noopener noreferrer" className="text-xs text-purple-600 hover:underline mt-1 inline-block">
                      Join Link →
                    </a>
                  )}
                </motion.div>
              ))}
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}