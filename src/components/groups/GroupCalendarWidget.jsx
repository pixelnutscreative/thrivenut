import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { isSameDay, parseISO, format } from 'date-fns';

export default function GroupCalendarWidget({ group, myMembership, isAdmin }) {
  const [date, setDate] = useState(new Date());

  const { data: events = [] } = useQuery({
    queryKey: ['groupEvents', group.id],
    queryFn: () => base44.entities.GroupEvent.filter({ group_id: group.id }, 'start_time'),
  });

  const visibleEvents = events.filter(event => {
    if (isAdmin) return true;
    const levelMatch = !event.target_levels || event.target_levels.length === 0 || event.target_levels.includes(myMembership?.level);
    const userMatch = !event.target_users || event.target_users.length === 0 || event.target_users.includes(myMembership?.user_email);
    return levelMatch && userMatch;
  });

  const activeDates = visibleEvents.map(e => new Date(e.start_time));

  // Function to show events for a specific day in a popover or list below
  const eventsOnSelectedDate = visibleEvents.filter(e => isSameDay(new Date(e.start_time), date));

  const nextEvents = visibleEvents
    .filter(e => new Date(e.start_time) >= new Date())
    .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
    .slice(0, 3);

  return (
    <Card className="border-0 shadow-lg bg-white/5 backdrop-blur-sm text-white">
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-sm font-bold uppercase tracking-wider text-white/80 flex items-center gap-2">
            Upcoming Events
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="space-y-3">
            {nextEvents.length > 0 ? nextEvents.map(event => (
                <div key={event.id} className="text-sm bg-white/10 p-3 rounded-lg border border-white/10 flex items-center justify-between group hover:bg-white/20 transition-colors">
                    <div>
                        <div className="font-bold text-white mb-1">{event.title}</div>
                        <div className="text-xs text-white/70 flex items-center gap-2">
                            <span className="bg-purple-500/30 px-1.5 py-0.5 rounded">
                                {format(new Date(event.start_time), 'MMM d')}
                            </span>
                            <span>{format(new Date(event.start_time), 'h:mm a')}</span>
                        </div>
                    </div>
                </div>
            )) : (
                <div className="text-sm text-white/40 italic text-center py-4 bg-white/5 rounded-lg">
                    No upcoming events
                </div>
            )}
        </div>
      </CardContent>
    </Card>
  );
}