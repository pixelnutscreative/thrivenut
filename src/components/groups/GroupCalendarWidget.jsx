import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Clock } from 'lucide-react';
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
    <Card className="border-0 shadow-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-lg font-bold uppercase tracking-wider text-gray-700 dark:text-gray-200 flex items-center gap-2">
            <Clock className="w-6 h-6 text-purple-600" /> Calendar
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="space-y-3">
            {nextEvents.length > 0 ? nextEvents.map(event => (
                <div key={event.id} className="text-sm bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg border border-gray-100 dark:border-gray-700 flex items-center justify-between group hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <div>
                        <div className="font-bold text-gray-900 dark:text-white mb-1 text-base">{event.title}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                            <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded font-medium">
                                {format(new Date(event.start_time), 'MMM d')}
                            </span>
                            <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" /> {format(new Date(event.start_time), 'h:mm a')}
                            </span>
                        </div>
                    </div>
                </div>
            )) : (
                <div className="text-sm text-gray-400 italic text-center py-6 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    No upcoming events
                </div>
            )}
        </div>
      </CardContent>
    </Card>
  );
}