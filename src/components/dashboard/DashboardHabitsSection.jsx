import React, { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Flame, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { format, subDays, parseISO } from 'date-fns';

export default function DashboardHabitsSection({ userEmail }) {
  const queryClient = useQueryClient();
  const todayStr = format(new Date(), 'yyyy-MM-dd');

  const { data: habits = [] } = useQuery({
    queryKey: ['habits', userEmail],
    queryFn: async () => {
      return await base44.entities.Habit.filter({ 
        created_by: userEmail,
        is_active: true
      });
    },
    enabled: !!userEmail,
    staleTime: 60000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 2,
  });

  const { data: habitLogs = [] } = useQuery({
    queryKey: ['habitLogs', userEmail],
    queryFn: async () => {
      // Optimized: fetch recent logs only would be better, but filter is okay for now
      return await base44.entities.HabitLog.filter({ created_by: userEmail }, '-date');
    },
    enabled: !!userEmail,
    staleTime: 60000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 2,
  });

  const habitStats = useMemo(() => {
    const stats = {};
    habits.forEach(habit => {
      const logs = habitLogs.filter(l => l.habit_id === habit.id).map(l => l.date).sort().reverse();
      let current = 0;
      if (logs.length > 0) {
        const lastLogDate = logs[0];
        const yesterdayStr = format(subDays(new Date(), 1), 'yyyy-MM-dd');
        
        if (lastLogDate === todayStr || lastLogDate === yesterdayStr) {
          current = 1;
          let checkDate = parseISO(lastLogDate);
          for (let i = 1; i < logs.length; i++) {
            const expectedPrev = format(subDays(checkDate, 1), 'yyyy-MM-dd');
            if (logs[i] === expectedPrev) {
              current++;
              checkDate = subDays(checkDate, 1);
            } else {
              break;
            }
          }
        }
      }
      stats[habit.id] = current;
    });
    return stats;
  }, [habits, habitLogs, todayStr]);

  if (habits.length === 0) return null;

  return (
    <Card className="shadow-sm border border-gray-100 bg-white">
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg font-bold text-gray-900">
            <Flame className="w-5 h-5 text-orange-500" />
            Habits
          </CardTitle>
          <Link to={createPageUrl('Habits')}>
            <Button variant="ghost" size="sm" className="h-8 text-gray-400 hover:text-gray-600">
              View All <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="space-y-3">
          {habits.slice(0, 5).map(habit => (
            <div key={habit.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-lg flex-shrink-0" 
                  style={{ backgroundColor: habit.color || '#F59E0B' }}
                />
                <span className="font-medium text-gray-800 text-sm">{habit.name}</span>
              </div>
              <div className="flex items-center gap-1 font-bold text-gray-700">
                <Flame className="w-4 h-4 text-orange-500" />
                {habitStats[habit.id] || 0}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}