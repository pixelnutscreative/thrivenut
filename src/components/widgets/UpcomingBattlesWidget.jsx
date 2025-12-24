import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Swords, Calendar, Clock, User } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';

export default function UpcomingBattlesWidget() {
  const { data: battles = [] } = useQuery({
    queryKey: ['upcomingBattles'],
    queryFn: async () => {
      // Fetch planned battles
      const planned = await base44.entities.BattlePlan.filter({ status: 'Planned' });
      // Fetch active battles if any
      const active = await base44.entities.BattlePlan.filter({ status: 'Active' });
      
      const all = [...active, ...planned];
      // Sort by date
      return all.sort((a, b) => new Date(a.battle_date) - new Date(b.battle_date));
    }
  });

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <Swords className="w-5 h-5 text-red-500" />
          Upcoming Battles
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-[250px] px-6 pb-4">
          {battles.length > 0 ? (
            <div className="space-y-3 pt-2">
              {battles.map(battle => (
                <div key={battle.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold">
                      VS
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{battle.opponent}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        {battle.status === 'Active' ? (
                          <Badge className="bg-red-500 text-white hover:bg-red-600 px-1.5 py-0 h-4 text-[10px]">LIVE NOW</Badge>
                        ) : (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {format(new Date(battle.battle_date), 'h:mm a')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-700">
                      {format(new Date(battle.battle_date), 'MMM d')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 py-8">
              <Swords className="w-8 h-8 mb-2 opacity-50" />
              <p>No battles scheduled</p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}