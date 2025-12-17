import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Flame, Calendar, TrendingUp, Plus, Check, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useTheme } from '../components/shared/useTheme';
import { format, startOfWeek, addDays, subDays, isSameDay, parseISO } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

export default function Habits() {
  const { bgClass, textClass, cardBgClass } = useTheme();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 0 })); // Sunday start
  const [newHabitTitle, setNewHabitTitle] = useState('');
  const [newHabitEmoji, setNewHabitEmoji] = useState('✨');
  const [newHabitColor, setNewHabitColor] = useState('#F59E0B'); // Default amber

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  // Fetch Habits (Goals with type 'habit')
  const { data: habits = [], isLoading: habitsLoading } = useQuery({
    queryKey: ['habits', user?.email],
    queryFn: async () => {
      const all = await base44.entities.Goal.filter({ 
        created_by: user.email, 
        status: 'active',
        goal_type: 'habit'
      });
      return all;
    },
    enabled: !!user,
  });

  // Fetch Habit Logs (All for now to calc streaks)
  const { data: habitLogs = [], isLoading: logsLoading } = useQuery({
    queryKey: ['habitLogs', user?.email],
    queryFn: async () => {
      // Fetching all logs might get heavy eventually, but fine for now
      return await base44.entities.HabitLog.filter({ created_by: user.email }, '-date');
    },
    enabled: !!user,
  });

  // Toggle Mutation
  const toggleHabitMutation = useMutation({
    mutationFn: async ({ habitId, date, existingLog }) => {
      if (existingLog) {
        return await base44.entities.HabitLog.delete(existingLog.id);
      } else {
        return await base44.entities.HabitLog.create({
          goal_id: habitId,
          date: date,
          completed_at: new Date().toISOString()
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habitLogs'] });
    },
  });

  // Create Habit Mutation
  const createHabitMutation = useMutation({
    mutationFn: async (title) => {
      return await base44.entities.Goal.create({
        title: title,
        emoji: newHabitEmoji,
        category: 'personal', // Default
        goal_type: 'habit',
        status: 'active',
        frequency: 'daily',
        start_date: format(new Date(), 'yyyy-MM-dd'),
        current_value: 0, // Used for streak in Goal entity if we sync it, but we use logs now
        custom_category_name: newHabitColor // Hack: storing color in custom_category_name or similar if needed, or just use category
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      setShowAddModal(false);
      setNewHabitTitle('');
    },
  });

  // Calculations
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  
  const habitsStats = useMemo(() => {
    if (!habits.length) return { todayCount: 0, activeCount: 0, bestStreak: 0 };

    const activeCount = habits.length;
    const todayLogs = habitLogs.filter(l => l.date === todayStr);
    const todayCount = todayLogs.length;

    // Calculate streaks
    let maxStreak = 0;
    
    habits.forEach(habit => {
      const logs = habitLogs.filter(l => l.goal_id === habit.id).map(l => l.date).sort();
      let currentStreak = 0;
      
      // Check from today backwards
      let checkDate = new Date();
      // If today is done, start from today. If not, start from yesterday.
      // Actually, standard streak logic: 
      // If completed today: streak = 1 + streak(yesterday)
      // If not completed today: streak = streak(yesterday)
      
      const isTodayDone = logs.includes(todayStr);
      let dateIter = isTodayDone ? new Date() : subDays(new Date(), 1);
      
      while (true) {
        const dStr = format(dateIter, 'yyyy-MM-dd');
        if (logs.includes(dStr)) {
          currentStreak++;
          dateIter = subDays(dateIter, 1);
        } else {
          break;
        }
      }
      if (currentStreak > maxStreak) maxStreak = currentStreak;
      
      // Attach streak to habit object for display (optional, better in render)
      habit.currentStreak = currentStreak;
    });

    return { todayCount, activeCount, bestStreak: maxStreak };
  }, [habits, habitLogs, todayStr]);

  // Calendar Grid
  const weekDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      days.push(addDays(currentWeekStart, i));
    }
    return days;
  }, [currentWeekStart]);

  const colors = [
    { bg: 'bg-amber-400', text: 'text-amber-700', name: 'Amber' },
    { bg: 'bg-orange-400', text: 'text-orange-700', name: 'Orange' },
    { bg: 'bg-purple-400', text: 'text-purple-700', name: 'Purple' },
    { bg: 'bg-green-400', text: 'text-green-700', name: 'Green' },
    { bg: 'bg-blue-400', text: 'text-blue-700', name: 'Blue' },
    { bg: 'bg-pink-400', text: 'text-pink-700', name: 'Pink' },
  ];

  // Helper to get log for a cell
  const getLog = (habitId, date) => {
    const dStr = format(date, 'yyyy-MM-dd');
    return habitLogs.find(l => l.goal_id === habitId && l.date === dStr);
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
            onClick={() => setShowAddModal(true)}
            className="bg-cyan-400 hover:bg-cyan-500 text-white font-medium px-6 shadow-lg shadow-cyan-200"
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
                {habitsStats.todayCount}/{habitsStats.activeCount}
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
                {habitsStats.bestStreak}
              </h2>
              <p className="text-gray-400 font-medium">Best Streak</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center mb-3">
                <Calendar className="w-6 h-6 text-purple-500" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-1">
                {habitsStats.activeCount}
              </h2>
              <p className="text-gray-400 font-medium">Active Habits</p>
            </CardContent>
          </Card>
        </div>

        {/* Weekly View */}
        <Card className="border-0 shadow-lg">
          <div className="p-6 border-b flex items-center justify-between bg-gray-50/50 rounded-t-xl">
            <h3 className="font-bold text-xl text-gray-900">This Week</h3>
            <div className="flex items-center gap-4 text-sm text-gray-500 font-medium">
              <div className="flex items-center bg-white rounded-lg border px-1">
                <button onClick={() => setCurrentWeekStart(d => subDays(d, 7))} className="p-1 hover:bg-gray-100 rounded">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-3">
                  {format(weekDays[0], 'MMM d')} - {format(weekDays[6], 'MMM d')}
                </span>
                <button onClick={() => setCurrentWeekStart(d => addDays(d, 7))} className="p-1 hover:bg-gray-100 rounded">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-6 font-medium text-gray-500 w-[200px]">Habit</th>
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
                </tr>
              </thead>
              <tbody className="divide-y">
                {habits.map((habit, idx) => (
                  <tr key={habit.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-6">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${
                          // Cycle colors based on index for variety, or use habit.custom_category_name if we stored color there
                          habit.custom_category_name && colors.some(c => c.bg.includes(habit.custom_category_name))
                            ? colors.find(c => c.bg.includes(habit.custom_category_name))?.bg
                            : colors[idx % colors.length].bg
                        }`} />
                        <div>
                          <p className="font-bold text-gray-900">{habit.title}</p>
                          <p className="text-xs text-gray-400">{habit.frequency || 'daily'}</p>
                        </div>
                      </div>
                    </td>
                    {weekDays.map(day => {
                      const log = getLog(habit.id, day);
                      const isCompleted = !!log;
                      // const isTodayOrPast = day <= new Date(); // Can check future
                      
                      return (
                        <td key={day.toString()} className="p-4 text-center">
                          <button
                            onClick={() => toggleHabitMutation.mutate({ 
                              habitId: habit.id, 
                              date: format(day, 'yyyy-MM-dd'),
                              existingLog: log 
                            })}
                            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                              isCompleted 
                                ? 'bg-amber-400 text-white shadow-md shadow-amber-200 scale-100' 
                                : 'bg-gray-50 border border-gray-100 hover:border-amber-200 hover:bg-amber-50 scale-95'
                            }`}
                          >
                            {isCompleted && <Check className="w-6 h-6 stroke-[3]" />}
                          </button>
                        </td>
                      );
                    })}
                    <td className="p-6 text-center">
                      <div className="flex items-center justify-center gap-1 font-bold text-gray-700">
                        <Flame className="w-4 h-4 text-orange-400" />
                        {habit.currentStreak || 0}
                      </div>
                    </td>
                  </tr>
                ))}
                {habits.length === 0 && (
                  <tr>
                    <td colSpan={9} className="p-12 text-center text-gray-400">
                      No habits yet. Click "Add Habit" to start!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

      </div>

      {/* Add Habit Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Habit</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Habit Name</Label>
              <Input 
                placeholder="e.g. Read 30 mins" 
                value={newHabitTitle}
                onChange={(e) => setNewHabitTitle(e.target.value)}
              />
            </div>
            {/* Color/Emoji picker could go here */}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddModal(false)}>Cancel</Button>
            <Button 
              onClick={() => createHabitMutation.mutate(newHabitTitle)}
              disabled={!newHabitTitle.trim() || createHabitMutation.isPending}
              className="bg-cyan-500 hover:bg-cyan-600 text-white"
            >
              {createHabitMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Habit'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}