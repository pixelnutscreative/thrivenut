import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Swords, Clock, AlertCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format, parseISO, isAfter } from 'date-fns';

export default function TikTokBattlesWidget({ userEmail, userTimezone = 'UTC' }) {
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
    queryKey: ['upcomingBattles', userEmail],
    queryFn: async () => {
      // Filter battles for current user that are planned or active
      const allBattles = await base44.entities.BattlePlan.filter({ 
        created_by: userEmail
      });
      
      const now = new Date();
      // Filter for future/ongoing battles only
      return allBattles
        .filter(b => b.status !== 'Completed' && (b.battle_date ? isAfter(parseISO(b.battle_date), new Date(now.getTime() - 2 * 60 * 60 * 1000)) : true)) // Show if within last 2 hours or future
        .sort((a, b) => new Date(a.battle_date) - new Date(b.battle_date))
        .slice(0, 5); // Take top 5
    },
    enabled: !!userEmail,
    staleTime: 60000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 2,
  });

  return (
    <Card className="h-full border-blue-200 bg-blue-50/30">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg text-blue-900">
          <Swords className="w-5 h-5 text-blue-600" />
          Upcoming Battles
        </CardTitle>
      </CardHeader>
      <CardContent>
        {battles.length === 0 ? (
          <div className="text-center py-8 text-blue-400 text-sm">
            No upcoming battles scheduled.
          </div>
        ) : (
          <div className="space-y-3">
            {battles.map((battle) => (
              <div key={battle.id} className="p-3 bg-white rounded-lg border border-blue-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
                <div className="flex justify-between items-start mb-2 pl-2">
                  <div className="font-bold text-blue-900">VS {battle.opponent}</div>
                  <Badge variant={battle.status === 'Active' ? 'destructive' : 'secondary'} className={battle.status === 'Active' ? 'animate-pulse' : ''}>
                    {battle.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600 pl-2">
                   <div className="flex items-center gap-1">
                     <Clock className="w-3 h-3" />
                     {battle.battle_date ? (
                       <span title={timezone}>
                         {formatInTimeZone(parseISO(battle.battle_date), timezone, 'MMM d, h:mm a zzz')}
                       </span>
                     ) : 'TBD'}
                   </div>
                   {battle.creator_name && <div className="text-xs text-gray-500">by {battle.creator_name}</div>}
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