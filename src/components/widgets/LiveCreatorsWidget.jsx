import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Video, User, Clock, ExternalLink } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';

export default function LiveCreatorsWidget() {
  const { data: lives = [] } = useQuery({
    queryKey: ['todaysLives'],
    queryFn: async () => {
      const allSchedules = await base44.entities.LiveSchedule.list();
      const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
      const todayDate = new Date().toISOString().split('T')[0];
      
      // Filter for today's lives
      const todaysLives = allSchedules.filter(schedule => {
        // Recurring on this day
        if (schedule.is_recurring && schedule.recurring_days?.includes(today)) return true;
        // Specific date is today
        if (!schedule.is_recurring && schedule.specific_date === todayDate) return true;
        return false;
      });

      // Sort by time (simple string sort for now, ideally parse time)
      return todaysLives.sort((a, b) => a.time.localeCompare(b.time));
    }
  });

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <Video className="w-5 h-5 text-purple-500" />
          Creators Live Today
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-[250px] px-6 pb-4">
          {lives.length > 0 ? (
            <div className="space-y-3 pt-2">
              {lives.map(live => (
                <div key={live.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100 hover:bg-gray-100 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{live.host_username}</p>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {live.time}
                      </p>
                    </div>
                  </div>
                  <a 
                    href={`https://www.tiktok.com/@${live.host_username}/live`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-2 text-gray-400 hover:text-purple-600 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 py-8">
              <Video className="w-8 h-8 mb-2 opacity-50" />
              <p>No lives scheduled for today</p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}