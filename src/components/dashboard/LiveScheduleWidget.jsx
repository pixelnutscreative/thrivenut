import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Video, Calendar, Clock, User } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format, parseISO, isSameDay } from 'date-fns';

export default function LiveScheduleWidget({ userEmail }) {
  // Fetch lives
  const { data: lives = [] } = useQuery({
    queryKey: ['todaysLives', userEmail],
    queryFn: async () => {
      const allLives = await base44.entities.LiveSchedule.filter({ created_by: userEmail });
      
      const today = new Date();
      const todayName = format(today, 'EEEE'); // Monday, Tuesday...

      return allLives.filter(live => {
        // One-time lives for today
        if (!live.is_recurring && live.specific_date) {
          return isSameDay(parseISO(live.specific_date), today);
        }
        // Recurring lives for today
        if (live.is_recurring && live.recurring_days && Array.isArray(live.recurring_days)) {
          return live.recurring_days.includes(todayName);
        }
        return false;
      }).sort((a, b) => {
         // Sort logic is tricky with time strings "7:00 PM". 
         // Simple sort for now or sophisticated parsing if needed. 
         // Assuming consistent format can just string compare or leave as is.
         return a.time.localeCompare(b.time);
      });
    },
    enabled: !!userEmail,
    staleTime: 60000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 2,
  });

  return (
    <Card className="h-full border-pink-200 bg-pink-50/30">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg text-pink-900">
          <Video className="w-5 h-5 text-pink-600" />
          Today's Live Schedule
        </CardTitle>
      </CardHeader>
      <CardContent>
        {lives.length === 0 ? (
          <div className="text-center py-8 text-pink-400 text-sm">
            No creator lives scheduled for today.
          </div>
        ) : (
          <div className="space-y-3">
            {lives.map((live) => (
              <div key={live.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-pink-100 shadow-sm hover:shadow-md transition-all">
                 <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 border border-pink-200">
                     <User className="w-5 h-5" />
                   </div>
                   <div>
                     <div className="font-bold text-gray-900">{live.host_username}</div>
                     <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Badge variant="outline" className="h-5 px-1 bg-pink-50 border-pink-200 text-pink-700">
                          {live.time}
                        </Badge>
                        <span className="truncate max-w-[120px]">
                           {live.live_types?.join(', ') || 'Live'}
                        </span>
                     </div>
                   </div>
                 </div>
                 
                 {live.audience_restriction === '18+' && (
                   <Badge variant="destructive" className="text-[10px] h-5">18+</Badge>
                 )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}