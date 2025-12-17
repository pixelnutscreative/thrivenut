import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Flame, TrendingUp, Plus, Check, ChevronLeft, ChevronRight, MoreVertical, Edit, Trash2, Calendar as CalendarIcon } from 'lucide-react';
import { useTheme } from '../components/shared/useTheme';
import { format, startOfWeek, addDays, subDays, isSameDay, isToday, parseISO } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import HabitDialog from '../components/habits/HabitDialog';

export default function Habits() {
  const { bgClass, textClass, primaryColor } = useTheme();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [editingHabit, setEditingHabit] = useState(null);
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 0 })); // Sunday start

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  // Fetch Habits
  const { data: habits = [], isLoading: habitsLoading } = useQuery({
    queryKey: ['habits', user?.email],
    queryFn: async () => {
      return await base44.entities.Habit.filter({ 
        created_by: user.email,
        is_active: true
      });
    },
    enabled: !!user,
  });

  // Fetch Habit Logs
  const { data: habitLogs = [], isLoading: logsLoading } = useQuery({
    queryKey: ['habitLogs', user?.email],
    queryFn: async () => {
      // Fetching all logs might get heavy eventually, but fine for now
      return await base44.entities.HabitLog.filter({ created_by: user.email }, '-date');
    },
    enabled: !!user,
  });

  // Mutations
  const createHabitMutation = useMutation({
    mutationFn: (data) => base44.entities.Habit.create({ ...data, current_streak: 0, best_streak: 0 }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      setShowDialog(false);
      setEditingHabit(null);
    },
  });

  const updateHabitMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Habit.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      setShowDialog(false);
      setEditingHabit(null);
    },
  });

  const deleteHabitMutation = useMutation({
    mutationFn: (id) => base44.entities.Habit.update(id, { is_active: false, archived_at: new Date().toISOString() }), // Soft delete
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['habits'] }),
  });

  const toggleLogMutation = useMutation({
    mutationFn: async ({ habit, date, existingLog }) => {
      let newStreak = habit.current_streak;
      let newBest = habit.best_streak;
      const today = format(new Date(), 'yyyy-MM-dd');
      const targetDate = date; // YYYY-MM-DD
      
      // 1. Toggle the log
      if (existingLog) {
        await base44.entities.HabitLog.delete(existingLog.id);
        // If we removed a log from today/yesterday, we might need to recalc streak
        // For simplicity, we'll let the streak re-calc logic below handle it
      } else {
        await base44.entities.HabitLog.create({
          habit_id: habit.id,
          date: targetDate,
          completed_at: new Date().toISOString(),
          day_of_week: format(new Date(targetDate), 'EEEE')
        });
      }

      // 2. Recalculate streak (simplified logic)
      // We fetch active logs for this habit locally to calc streak
      // Note: This local calc isn't perfect without a full refetch, but gives instant feedback
      // Ideally, we'd do this on the backend or refetch logs
      // For now, let's invalidate queries to trigger a re-render which will recalculate based on logs
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habitLogs'] });
      queryClient.invalidateQueries({ queryKey: ['habits'] });
    },
  });

  // Calculations
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  
  const stats = useMemo(() => {
    if (!habits.length) return { todayCount: 0, activeCount: 0, bestStreak: 0 };

    const activeCount = habits.length;
    const todayLogs = habitLogs.filter(l => l.date === todayStr);
    const todayCount = todayLogs.length;

    // Calculate streaks for display
    let globalBestStreak = 0;
    
    // We can also calculate streaks per habit here to display in the table
    const habitStreaks = {};

    habits.forEach(habit => {
      const logs = habitLogs.filter(l => l.habit_id === habit.id).map(l => l.date).sort().reverse(); // Newest first
      
      let current = 0;
      let best = habit.best_streak || 0; // Use stored best or calc? Let's rely on logs for current
      
      // Current streak logic
      if (logs.length > 0) {
        const lastLogDate = logs[0];
        const isToday = lastLogDate === todayStr;
        const yesterdayStr = format(subDays(new Date(), 1), 'yyyy-MM-dd');
        
        // If logged today, start counting. If logged yesterday, start counting.
        // If last log is older than yesterday, streak is broken (0).
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
      
      if (current > globalBestStreak) globalBestStreak = current;
      habitStreaks[habit.id] = current;
    });

    return { todayCount, activeCount, bestStreak: globalBestStreak, habitStreaks };
  }, [habits, habitLogs, todayStr]);

  // Calendar Grid
  const weekDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      days.push(addDays(currentWeekStart, i));
    }
    return days;
  }, [currentWeekStart]);

  const handleSaveHabit = (data) => {
    if (editingHabit) {
      updateHabitMutation.mutate({ id: editingHabit.id, data });
    } else {
      createHabitMutation.mutate(data);
    }
  };

  const getLog = (habitId, date) => {
    const dStr = format(date, 'yyyy-MM-dd');
    return habitLogs.find(l => l.habit_id === habitId && l.date === dStr);
  };

  return (
    <div className={`min-h-screen ${bgClass} p-4 md:p-8`}>
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-1">Habits</h1>
            <p className="text-gray-500">Build consistency, one day at a time</p>
          </div>
          <Button 
            onClick={() => { setEditingHabit(null); setShowDialog(true); }}
            className="bg-cyan-500 hover:bg-cyan-600 text-white font-medium px-6 shadow-lg shadow-cyan-200"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Habit
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center mb-3">
                <Flame className="w-6 h-6 text-orange-500" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-1">
                {stats.todayCount}/{stats.activeCount}
              </h2>
              <p className="text-gray-400 font-medium">Today</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-full bg-cyan-50 flex items-center justify-center mb-3">
                <TrendingUp className="w-6 h-6 text-cyan-500" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-1">
                {stats.bestStreak}
              </h2>
              <p className="text-gray-400 font-medium">Best Streak</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center mb-3">
                <CalendarIcon className="w-6 h-6 text-purple-500" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-1">
                {stats.activeCount}
              </h2>
              <p className="text-gray-400 font-medium">Active Habits</p>
            </CardContent>
          </Card>
        </div>

        {/* Weekly View */}
        <Card className="border-0 shadow-lg bg-white overflow-hidden">
          <div className="p-6 border-b flex items-center justify-between bg-gray-50/50">
            <h3 className="font-bold text-xl text-gray-900">This Week</h3>
            <div className="flex items-center gap-4 text-sm text-gray-500 font-medium">
              <div className="flex items-center bg-white rounded-lg border px-1">
                <button onClick={() => setCurrentWeekStart(d => subDays(d, 7))} className="p-1 hover:bg-gray-100 rounded">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-3 min-w-[100px] text-center">
                  {format(weekDays[0], 'MMM d')} - {format(weekDays[6], 'MMM d')}
                </span>
                <button onClick={() => setCurrentWeekStart(d => addDays(d, 7))} className="p-1 hover:bg-gray-100 rounded">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 0 }))}
                className="hidden sm:flex"
              >
                Today
              </Button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-6 font-medium text-gray-500 w-[250px]">Habit</th>
                  {weekDays.map(day => (
                    <th key={day.toString()} className="p-4 text-center min-w-[60px]">
                      <div className="flex flex-col items-center">
                        <span className="text-xs text-gray-400 font-medium mb-1">{format(day, 'EEE')}</span>
                        <span className={`text-sm font-bold w-8 h-8 flex items-center justify-center rounded-full ${
                          isSameDay(day, new Date()) ? 'bg-cyan-50 text-cyan-600' : 'text-gray-900'
                        }`}>
                          {format(day, 'd')}
                        </span>
                      </div>
                    </th>
                  ))}
                  <th className="p-6 text-center w-[80px]">
                    <Flame className="w-5 h-5 text-orange-400 mx-auto" />
                  </th>
                  <th className="p-6 text-center w-[60px]"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {habits.map((habit) => {
                  const currentStreak = stats.habitStreaks?.[habit.id] || 0;
                  
                  return (
                    <tr key={habit.id} className="group hover:bg-gray-50/50 transition-colors">
                      <td className="p-6">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-3 h-3 rounded-full flex-shrink-0" 
                            style={{ backgroundColor: habit.color || '#F59E0B' }}
                          />
                          <div className="min-w-0">
                            <p className="font-bold text-gray-900 truncate max-w-[180px]" title={habit.name}>{habit.name}</p>
                            <p className="text-xs text-gray-400 truncate">
                              {habit.frequency === 'specific_days' 
                                ? habit.target_days?.map(d => d.slice(0, 3)).join(', ') 
                                : habit.frequency || 'daily'}
                            </p>
                          </div>
                        </div>
                      </td>
                      {weekDays.map(day => {
                        const log = getLog(habit.id, day);
                        const isCompleted = !!log;
                        const dayName = format(day, 'EEEE');
                        const isTargetDay = habit.frequency === 'daily' || 
                                          (habit.frequency === 'specific_days' && habit.target_days?.includes(dayName)) ||
                                          habit.frequency === 'weekly'; // Weekly allows any day
                        
                        // Disable future days
                        const isFuture = day > new Date();

                        return (
                          <td key={day.toString()} className="p-4 text-center">
                            {isTargetDay ? (
                              <button
                                onClick={() => !isFuture && toggleLogMutation.mutate({ 
                                  habit, 
                                  date: format(day, 'yyyy-MM-dd'),
                                  existingLog: log 
                                })}
                                disabled={isFuture}
                                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all mx-auto ${
                                  isCompleted 
                                    ? 'text-white shadow-md scale-100' 
                                    : `bg-gray-50 border border-gray-100 ${!isFuture ? 'hover:scale-95 cursor-pointer' : 'opacity-50 cursor-default'}`
                                }`}
                                style={isCompleted ? { 
                                  backgroundColor: habit.color || '#F59E0B',
                                  boxShadow: `0 4px 6px -1px ${habit.color}40`
                                } : isFuture ? {} : { borderColor: 'transparent' }}
                              >
                                {isCompleted && <Check className="w-5 h-5 stroke-[3]" />}
                                {!isCompleted && !isFuture && (
                                  <div className="w-3 h-3 rounded-full bg-gray-200 group-hover:bg-gray-300 transition-colors" />
                                )}
                              </button>
                            ) : (
                              <div className="w-2 h-2 rounded-full bg-gray-100 mx-auto" />
                            )}
                          </td>
                        );
                      })}
                      <td className="p-6 text-center">
                        <div className="flex items-center justify-center gap-1 font-bold text-gray-700">
                          <Flame className="w-4 h-4 text-orange-400" />
                          {currentStreak}
                        </div>
                      </td>
                      <td className="p-6 text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                              <MoreVertical className="w-4 h-4 text-gray-400" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => { setEditingHabit(habit); setShowDialog(true); }}>
                              <Edit className="w-4 h-4 mr-2" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-red-600 focus:text-red-600"
                              onClick={() => {
                                if (confirm('Are you sure you want to archive this habit?')) {
                                  deleteHabitMutation.mutate(habit.id);
                                }
                              }}
                            >
                              <Trash2 className="w-4 h-4 mr-2" /> Archive
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
                {habits.length === 0 && (
                  <tr>
                    <td colSpan={10} className="p-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                          <TrendingUp className="w-6 h-6 text-gray-400" />
                        </div>
                        <p className="text-gray-500 font-medium">No active habits</p>
                        <p className="text-gray-400 text-sm max-w-xs">Start building your streak today by adding a new habit.</p>
                        <Button 
                          onClick={() => setShowDialog(true)}
                          className="mt-2 bg-cyan-500 hover:bg-cyan-600 text-white"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Habit
                        </Button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

      </div>

      <HabitDialog 
        open={showDialog} 
        onOpenChange={setShowDialog}
        habit={editingHabit}
        onSave={handleSaveHabit}
        isLoading={createHabitMutation.isPending || updateHabitMutation.isPending}
      />
    </div>
  );
}