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
        <div className="mb-4 bg-white/10 rounded-lg p-2">
            <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded-md border-0 text-white w-full flex justify-center p-0"
                classNames={{
                    head_cell: "text-white/60 font-normal text-[0.8rem]",
                    cell: "h-8 w-8 text-center text-sm p-0 relative [&:has([aria-selected])]:bg-purple-600 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                    day: "h-8 w-8 p-0 font-normal aria-selected:opacity-100 text-white hover:bg-white/20 rounded-full",
                    day_selected: "bg-purple-600 text-white hover:bg-purple-600 hover:text-white focus:bg-purple-600 focus:text-white",
                    day_today: "bg-white/20 text-white",
                    caption: "text-sm py-1 mb-2",
                    nav_button: "h-6 w-6 bg-transparent hover:bg-white/20 text-white p-0 opacity-70 hover:opacity-100"
                }}
                modifiers={{
                    hasEvent: activeDates
                }}
                modifiersStyles={{
                    hasEvent: { fontWeight: 'bold', textDecoration: 'underline decoration-purple-400' }
                }}
            />
        </div>

        <div className="space-y-2">
            {eventsOnSelectedDate.length > 0 ? (
                <>
                    <p className="text-xs font-semibold text-white/60 mb-1">Events on {format(date || new Date(), 'MMM d')}:</p>
                    {eventsOnSelectedDate.map(event => (
                        <div key={event.id} className="text-sm bg-white/10 p-2 rounded border border-white/10">
                            <div className="font-bold">{event.title}</div>
                            <div className="text-xs text-white/70">{format(new Date(event.start_time), 'h:mm a')}</div>
                        </div>
                    ))}
                </>
            ) : (
                <>
                    <p className="text-xs font-semibold text-white/60 mb-1">Next Up:</p>
                    {nextEvents.length > 0 ? nextEvents.map(event => (
                        <div key={event.id} className="text-sm bg-white/10 p-2 rounded border border-white/10 flex items-center justify-between">
                            <div>
                                <div className="font-bold truncate max-w-[140px]">{event.title}</div>
                                <div className="text-xs text-white/70">
                                    {format(new Date(event.start_time), 'MMM d, h:mm a')}
                                </div>
                            </div>
                        </div>
                    )) : (
                        <div className="text-xs text-white/40 italic">No upcoming events</div>
                    )}
                </>
            )}
        </div>
      </CardContent>
    </Card>
  );
}