import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Swords, Clock, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format, parseISO, isAfter, startOfDay, addDays } from 'date-fns';

export default function TikTokBattlesWidgetV2({ userEmail, userTimezone = 'UTC' }) {
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Fetch user preferences for timezone
  const { data: userPrefs = {} } = useQuery({
    queryKey: ['userPrefs', userEmail],
    queryFn: async () => {
      if (!userEmail) return {};
      const prefs = await base44.entities.UserPreferences.filter({ user_email: userEmail });
      return prefs[0] || {};
    },
    enabled: !!userEmail,
    staleTime: Infinity,
  });

  const timezone = userPrefs?.user_timezone || userTimezone || 'UTC';

  const { data: battles = [] } = useQuery({
    queryKey: ['upcomingBattles', userEmail, selectedDate],
    queryFn: async () => {
      const allBattles = await base44.entities.BattlePlan.filter({ 
        created_by: userEmail
      });
      
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
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm lg:text-lg text-blue-900">
            <Swords className="w-4 h-4 lg:w-5 lg:h-5 text-blue-600" />
            <span className="hidden sm:inline">Battles</span>
            <span className="sm:hidden">⚔️</span>
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={handlePrevDay} className="h-5 w-5 lg:h-6 lg:w-6">
              <ChevronLeft className="w-3 h-3 lg:w-4 lg:h-4" />
            </Button>
            <span className="text-[10px] lg:text-xs font-medium text-blue-800 min-w-[50px] lg:min-w-[80px] text-center">
              {format(selectedDate, 'MMM d')}
            </span>
            <Button variant="ghost" size="icon" onClick={handleNextDay} className="h-5 w-5 lg:h-6 lg:w-6">
              <ChevronRight className="w-3 h-3 lg:w-4 lg:h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-3 lg:p-6">
        {battles.length === 0 ? (
          <div className="text-center py-4 lg:py-8 text-blue-400 text-xs lg:text-sm">
            No battles today.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-3">
            {battles.map((battle) => (
              <div key={battle.id} className="p-2 lg:p-3 bg-white rounded border border-blue-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-0.5 lg:w-1 h-full bg-blue-500" />
                <div className="flex justify-between items-start gap-1 pl-1 lg:pl-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-xs lg:text-sm text-blue-900 truncate">VS {battle.opponent}</div>
                    {battle.creator_name && (
                      <div className="text-[10px] lg:text-xs text-gray-500 truncate">by {battle.creator_name}</div>
                    )}
                  </div>
                  <Badge variant={battle.status === 'Active' ? 'destructive' : 'secondary'} className={`text-[10px] lg:text-xs ${battle.status === 'Active' ? 'animate-pulse' : ''}`}>
                    {battle.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-1 text-[10px] lg:text-xs text-gray-600 pl-1 lg:pl-2 mt-1">
                   <Clock className="w-2.5 h-2.5 lg:w-3 lg:h-3" />
                   {battle.battle_date ? (
                     <span title={timezone}>
                       {formatInTimeZone(parseISO(battle.battle_date), timezone, 'h:mm a zzz')}
                     </span>
                   ) : 'TBD'}
                 </div>
                {battle.mist_strategy && battle.mist_strategy !== 'No' && (
                  <div className="mt-1 pl-1 lg:pl-2 text-[9px] lg:text-xs flex items-center gap-0.5 text-amber-600 bg-amber-50 px-1 py-0.5 rounded w-fit">
                    <AlertCircle className="w-2 h-2 lg:w-3 lg:h-3" />
                    M: {battle.mist_strategy}
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