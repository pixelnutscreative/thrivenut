import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Swords, Clock, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format, parseISO, isAfter, startOfDay, addDays } from 'date-fns';

export default function TikTokBattlesWidgetV2({ userEmail }) {
  const [selectedDate, setSelectedDate] = useState(new Date());

  const { data: battles = [] } = useQuery({
    queryKey: ['upcomingBattles', userEmail, selectedDate],
    queryFn: async () => {
      const allBattles = await base44.entities.BattlePlan.filter({ 
        created_by: userEmail
      });
      
      const now = new Date();
      const dayStart = startOfDay(selectedDate);
      const dayEnd = addDays(dayStart, 1);

      return allBattles
        .filter(b => {
          if (b.status === 'Completed') return false;
          if (!b.battle_date) return false;
          const battleTime = parseISO(b.battle_date);
          return battleTime >= dayStart && battleTime < dayEnd;
        })
        .sort((a, b) => new Date(a.battle_date) - new Date(b.battle_date));
    },
    enabled: !!userEmail,
    staleTime: 60000,
    refetchOnWindowFocus: false,
  });

  const handlePrevDay = () => setSelectedDate(addDays(selectedDate, -1));
  const handleNextDay = () => setSelectedDate(addDays(selectedDate, 1));

  return (
    <Card className="h-full border-blue-200 bg-blue-50/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg text-blue-900">
            <Swords className="w-5 h-5 text-blue-600" />
            Battles
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={handlePrevDay} className="h-6 w-6">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-xs font-medium text-blue-800 min-w-[80px] text-center">
              {format(selectedDate, 'MMM d')}
            </span>
            <Button variant="ghost" size="icon" onClick={handleNextDay} className="h-6 w-6">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {battles.length === 0 ? (
          <div className="text-center py-8 text-blue-400 text-sm">
            No battles scheduled for this day.
          </div>
        ) : (
          <div className="space-y-3">
            {battles.map((battle) => (
              <div key={battle.id} className="p-3 bg-white rounded-lg border border-blue-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
                <div className="flex justify-between items-start mb-2 pl-2">
                  <div className="flex-1">
                    <div className="font-bold text-blue-900">VS {battle.opponent}</div>
                    {battle.creator_name && (
                      <div className="text-xs text-gray-500">by {battle.creator_name}</div>
                    )}
                  </div>
                  <Badge variant={battle.status === 'Active' ? 'destructive' : 'secondary'} className={battle.status === 'Active' ? 'animate-pulse' : ''}>
                    {battle.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600 pl-2">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {battle.battle_date ? format(parseISO(battle.battle_date), 'h:mm a') : 'TBD'}
                  </div>
                </div>
                {battle.mist_strategy && battle.mist_strategy !== 'No' && (
                  <div className="mt-2 pl-2 text-xs flex items-center gap-1 text-amber-600 bg-amber-50 p-1 rounded w-fit">
                    <AlertCircle className="w-3 h-3" />
                    Mist: {battle.mist_strategy}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}