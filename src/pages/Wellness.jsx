import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Droplet, Heart, Moon, Plus, Minus, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import SelfCareChecklist from '../components/wellness/SelfCareChecklist';
import EliminationTracker from '../components/wellness/EliminationTracker';
import QuickMedicationCheck from '../components/wellness/QuickMedicationCheck';
import QuickSupplementCheck from '../components/wellness/QuickSupplementCheck';
import QuickPetCareCheck from '../components/wellness/QuickPetCareCheck';
import QuickCareReminderCheck from '../components/wellness/QuickCareReminderCheck';
import WaterCheckIns from '../components/wellness/WaterCheckIns';
import FastingTracker from '../components/wellness/FastingTracker';
import CycleTracker from '../components/wellness/CycleTracker';
import NutritionTracker from '../components/wellness/NutritionTracker';
import { useTheme } from '../components/shared/useTheme';

const moodEmojis = {
  amazing: '🤩',
  good: '😊',
  okay: '😐',
  low: '😔',
  struggling: '😢'
};

export default function Wellness() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [preferences, setPreferences] = useState(null);
  const today = format(new Date(), 'yyyy-MM-dd');

  React.useEffect(() => {
    const loadUser = async () => {
      const userData = await base44.auth.me();
      setUser(userData);
      
      const prefs = await base44.entities.UserPreferences.filter({ user_email: userData.email });
      if (prefs[0]) {
        setPreferences(prefs[0]);
      }
    };
    loadUser();
  }, []);

  const { data: todaysWater } = useQuery({
    queryKey: ['waterToday', today],
    queryFn: async () => {
      const logs = await base44.entities.WaterLog.filter({ 
        date: today,
        created_by: user?.email 
      });
      return logs[0] || null;
    },
    enabled: !!user,
  });

  const { data: todaysMoods } = useQuery({
    queryKey: ['moodToday', today],
    queryFn: async () => {
      return await base44.entities.MoodLog.filter({ 
        date: today,
        created_by: user?.email 
      });
    },
    enabled: !!user,
  });

  const { data: todaysSleep } = useQuery({
    queryKey: ['sleepToday', today],
    queryFn: async () => {
      const logs = await base44.entities.SleepLog.filter({ 
        date: today,
        created_by: user?.email 
      });
      return logs[0] || null;
    },
    enabled: !!user,
  });

  const { data: selfCareLog } = useQuery({
    queryKey: ['selfCareToday', today],
    queryFn: async () => {
      const logs = await base44.entities.DailySelfCareLog.filter({ 
        date: today,
        created_by: user?.email 
      });
      return logs[0] || null;
    },
    enabled: !!user,
  });

  const { data: medicationsCount } = useQuery({
    queryKey: ['medicationsCount'],
    queryFn: async () => {
      const meds = await base44.entities.Medication.filter({ is_active: true, created_by: user?.email });
      return meds?.length || 0;
    },
    enabled: !!user,
  });

  const { data: supplementsCount } = useQuery({
    queryKey: ['supplementsCount'],
    queryFn: async () => {
      const supps = await base44.entities.Supplement.filter({ is_active: true, created_by: user?.email });
      return supps?.length || 0;
    },
    enabled: !!user,
  });

  const waterMutation = useMutation({
    mutationFn: async (increment) => {
      const newGlasses = (todaysWater?.glasses || 0) + increment;
      if (newGlasses < 0) return;
      
      if (todaysWater) {
        return await base44.entities.WaterLog.update(todaysWater.id, { glasses: newGlasses });
      } else {
        return await base44.entities.WaterLog.create({ date: today, glasses: newGlasses, goal_glasses: 8 });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waterToday'] });
    },
  });

  const moodMutation = useMutation({
    mutationFn: async ({ mood, notes }) => {
      return await base44.entities.MoodLog.create({
        date: today,
        timestamp: new Date().toISOString(),
        mood,
        notes: notes || ''
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moodToday'] });
    },
  });

  const sleepMutation = useMutation({
    mutationFn: async (sleepData) => {
      if (todaysSleep) {
        return await base44.entities.SleepLog.update(todaysSleep.id, sleepData);
      } else {
        return await base44.entities.SleepLog.create({ date: today, ...sleepData });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sleepToday'] });
    },
  });

  const selfCareMutation = useMutation({
    mutationFn: async ({ taskId, value }) => {
      if (selfCareLog) {
        return await base44.entities.DailySelfCareLog.update(selfCareLog.id, { [taskId]: value });
      } else {
        return await base44.entities.DailySelfCareLog.create({ 
          date: today, 
          [taskId]: value 
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['selfCareToday'] });
    },
  });

  const mealNotesMutation = useMutation({
    mutationFn: async ({ noteKey, value }) => {
      if (selfCareLog) {
        return await base44.entities.DailySelfCareLog.update(selfCareLog.id, { [noteKey]: value });
      } else {
        return await base44.entities.DailySelfCareLog.create({ 
          date: today, 
          [noteKey]: value 
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['selfCareToday'] });
    },
  });

  const eliminationMutation = useMutation({
    mutationFn: async (grades) => {
      if (selfCareLog) {
        return await base44.entities.DailySelfCareLog.update(selfCareLog.id, { elimination_grades: grades });
      } else {
        return await base44.entities.DailySelfCareLog.create({ 
          date: today, 
          elimination_grades: grades 
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['selfCareToday'] });
    },
  });

  const updatePreferencesMutation = useMutation({
    mutationFn: async (items) => {
      if (preferences) {
        return await base44.entities.UserPreferences.update(preferences.id, { items_to_eliminate: items });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['preferences'] });
    },
  });

  const updateSelfCareOrderMutation = useMutation({
    mutationFn: async (order) => {
      if (preferences) {
        return await base44.entities.UserPreferences.update(preferences.id, { self_care_order: order });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['preferences'] });
    },
  });

  const [moodForm, setMoodForm] = useState({ mood: 'good', notes: '' });
  const [sleepForm, setSleepForm] = useState({
    hours: todaysSleep?.hours || 7,
    quality: todaysSleep?.quality || 'good',
    notes: todaysSleep?.notes || ''
  });

  const [showSleepSettings, setShowSleepSettings] = useState(false);
  const [bedtimes, setBedtimes] = useState({});
  const [nightRoutine, setNightRoutine] = useState([]);
  
  // Update state when preferences load
  React.useEffect(() => {
    if (preferences) {
      setBedtimes(preferences.sleep_schedule || {});
      setNightRoutine(preferences.night_routine_order || ['bible_reading', 'journaling', 'medications', 'supplements', 'prayer', 'hygiene']);
    }
  }, [preferences]);

  const updatePreferencesMutation = useMutation({
    mutationFn: async (data) => {
      if (preferences) {
        return await base44.entities.UserPreferences.update(preferences.id, data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['preferences'] });
    }
  });

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const items = Array.from(nightRoutine);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setNightRoutine(items);
    updatePreferencesMutation.mutate({ night_routine_order: items });
  };

  const waterPercentage = todaysWater ? (todaysWater.glasses / todaysWater.goal_glasses) * 100 : 0;

  const formatTime = (isoString) => {
    return format(new Date(isoString), 'h:mm a');
  };

  const { isDark, bgClass, textClass, cardBgClass, subtextClass } = useTheme();

  return (
    <div className={`min-h-screen ${bgClass} p-4 md:p-8`}>
      <div className="max-w-5xl mx-auto space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
            Wellness Tracker
          </h1>
          <p className={subtextClass}>Take care of your mind and body</p>
        </motion.div>

        {/* Self-Care Checklist */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <SelfCareChecklist
            selfCareLog={selfCareLog}
            onToggleTask={(taskId, value) => selfCareMutation.mutate({ taskId, value })}
            onUpdateMealNotes={(noteKey, value) => mealNotesMutation.mutate({ noteKey, value })}
            requiredTasks={preferences?.required_self_care_tasks || []}
            preferences={preferences}
            medicationsCount={medicationsCount || 0}
            supplementsCount={supplementsCount || 0}
            onUpdateOrder={(order) => updateSelfCareOrderMutation.mutate(order)}
          />
        </motion.div>

        {/* Water Check-ins */}
        {preferences?.enable_water_reminders !== false && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.055 }}
          >
            <WaterCheckIns
              selfCareLog={selfCareLog}
              onToggle={(taskId, value) => selfCareMutation.mutate({ taskId, value })}
            />
          </motion.div>
        )}

        {/* Fasting Tracker */}
        {preferences?.intermittent_fasting && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.057 }}
          >
            <FastingTracker
              preferences={preferences}
              selfCareLog={selfCareLog}
              onUpdate={(field, value) => selfCareMutation.mutate({ taskId: field, value })}
            />
          </motion.div>
        )}

        {/* Quick Check Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06 }}
          className="grid md:grid-cols-2 gap-4"
        >
          <QuickMedicationCheck userEmail={user?.email} />
          <QuickSupplementCheck userEmail={user?.email} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.065 }}
          className="grid md:grid-cols-2 gap-4"
        >
          <QuickPetCareCheck userEmail={user?.email} />
          <QuickCareReminderCheck userEmail={user?.email} />
        </motion.div>

        {/* Nutrition & Cycle Tracking Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.07 }}
          className="grid md:grid-cols-2 gap-6"
        >
          {/* Nutrition Additions */}
          <NutritionTracker userEmail={user?.email} />

          {/* Cycle & Symptoms */}
          <CycleTracker userEmail={user?.email} />
        </motion.div>

        {/* Elimination Tracker */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
        >
          <EliminationTracker
            itemsToEliminate={preferences?.items_to_eliminate || []}
            eliminationGrades={selfCareLog?.elimination_grades || []}
            onUpdateGrades={(grades) => eliminationMutation.mutate(grades)}
            onUpdateItems={(items) => updatePreferencesMutation.mutate(items)}
            showItemManager={true}
          />
        </motion.div>

        {/* Water Intake */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className={`shadow-lg border-0 ${isDark ? 'bg-gradient-to-br from-blue-900/30 to-cyan-900/30' : 'bg-gradient-to-br from-blue-50 to-cyan-50'}`}>
            <CardHeader>
              <CardTitle className={`flex items-center gap-2 text-2xl ${textClass}`}>
                <Droplet className="w-7 h-7 text-blue-500" />
                Water Intake
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <div className={`text-6xl font-bold ${isDark ? 'text-blue-400' : 'text-blue-600'} mb-2`}>
                  {todaysWater?.glasses || 0}
                </div>
                <p className={`${subtextClass} text-lg`}>
                  of {todaysWater?.goal_glasses || 8} glasses
                </p>
              </div>
              <Progress value={waterPercentage} className="h-4" />
              <div className="flex justify-center gap-4">
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => waterMutation.mutate(-1)}
                  disabled={!todaysWater || todaysWater.glasses === 0}
                  className="w-20 h-20 rounded-full"
                >
                  <Minus className="w-8 h-8" />
                </Button>
                <Button
                  size="lg"
                  onClick={() => waterMutation.mutate(1)}
                  className="w-20 h-20 rounded-full bg-blue-500 hover:bg-blue-600"
                >
                  <Plus className="w-8 h-8" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Mood Tracker */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className={`shadow-lg border-0 ${isDark ? 'bg-gradient-to-br from-pink-900/30 to-rose-900/30' : 'bg-gradient-to-br from-pink-50 to-rose-50'}`}>
            <CardHeader>
              <CardTitle className={`flex items-center gap-2 text-2xl ${textClass}`}>
                <Heart className="w-7 h-7 text-pink-500" />
                Mood Check-In
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {todaysMoods && todaysMoods.length > 0 && (
                <div className={`space-y-2 p-4 ${isDark ? 'bg-gray-800/50' : 'bg-white/50'} rounded-lg`}>
                  <p className={`font-semibold ${textClass}`}>Today's Check-ins:</p>
                  <div className="flex flex-wrap gap-2">
                    {todaysMoods.map((log, i) => (
                      <div key={i} className={`px-4 py-2 ${isDark ? 'bg-gray-700' : 'bg-white'} rounded-full shadow-sm flex items-center gap-2`}>
                        <span className="text-2xl">{moodEmojis[log.mood]}</span>
                        <div className="text-sm">
                          <span className={`${subtextClass} flex items-center gap-1`}>
                            <Clock className="w-3 h-3" />
                            {log.timestamp ? formatTime(log.timestamp) : 'Earlier'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className={`text-sm font-medium ${textClass}`}>How are you feeling right now?</label>
                <div className="grid grid-cols-5 gap-2">
                  {Object.entries(moodEmojis).map(([key, emoji]) => (
                    <button
                      key={key}
                      onClick={() => setMoodForm({...moodForm, mood: key})}
                      className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center ${
                        moodForm.mood === key
                          ? `border-pink-500 ${isDark ? 'bg-pink-900/30' : 'bg-pink-50'} scale-105`
                          : `${isDark ? 'border-gray-600 hover:border-pink-400' : 'border-gray-200 hover:border-pink-300'}`
                      }`}
                    >
                      <span className="text-3xl mb-1">{emoji}</span>
                      <span className={`text-xs ${subtextClass} capitalize`}>{key}</span>
                    </button>
                  ))}
                </div>
              </div>

              <Textarea
                placeholder="Any notes about how you're feeling? (optional)"
                value={moodForm.notes}
                onChange={(e) => setMoodForm({...moodForm, notes: e.target.value})}
                rows={2}
              />

              <Button 
                onClick={() => {
                  moodMutation.mutate(moodForm);
                  setMoodForm({...moodForm, notes: ''});
                }}
                className="w-full bg-pink-500 hover:bg-pink-600"
              >
                Log Mood
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Sleep Tracker & Night Routine */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className={`shadow-lg border-0 ${isDark ? 'bg-gradient-to-br from-purple-900/30 to-indigo-900/30' : 'bg-gradient-to-br from-purple-50 to-indigo-50'}`}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className={`flex items-center gap-2 text-2xl ${textClass}`}>
                <Moon className="w-7 h-7 text-purple-500" />
                Sleep & Night Routine
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowSleepSettings(!showSleepSettings)}>
                <Settings className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {showSleepSettings ? (
                <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
                  <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-800/50' : 'bg-white/60'}`}>
                    <h4 className={`font-semibold mb-3 flex items-center gap-2 ${textClass}`}>
                      <Clock className="w-4 h-4" /> Target Bedtimes
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                        <div key={day}>
                          <label className={`text-xs font-medium block mb-1 ${subtextClass}`}>{day.slice(0, 3)}</label>
                          <Input 
                            type="time" 
                            value={bedtimes[day] || ''}
                            onChange={(e) => {
                              const newTimes = { ...bedtimes, [day]: e.target.value };
                              setBedtimes(newTimes);
                              updatePreferencesMutation.mutate({ sleep_schedule: newTimes });
                            }}
                            className="h-8 text-xs"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-800/50' : 'bg-white/60'}`}>
                    <h4 className={`font-semibold mb-2 flex items-center gap-2 ${textClass}`}>
                      <List className="w-4 h-4" /> Night Routine Order
                    </h4>
                    <p className={`text-xs ${subtextClass} mb-3`}>Drag to reorder your evening tasks</p>
                    
                    <DragDropContext onDragEnd={handleDragEnd}>
                      <Droppable droppableId="night-routine">
                        {(provided) => (
                          <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                            {nightRoutine.map((item, index) => (
                              <Draggable key={item} draggableId={item} index={index}>
                                {(provided) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    className={`p-3 rounded-lg border flex items-center gap-3 shadow-sm ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-purple-100'}`}
                                  >
                                    <div className="text-gray-400 cursor-grab active:cursor-grabbing">
                                      <List className="w-4 h-4" />
                                    </div>
                                    <span className={`capitalize flex-1 ${textClass}`}>{item.replace('_', ' ')}</span>
                                  </div>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </DragDropContext>
                  </div>
                  
                  <Button variant="outline" size="sm" onClick={() => setShowSleepSettings(false)} className="w-full">
                    Done
                  </Button>
                </div>
              ) : (
                <>
                  {/* Today's Target */}
                  <div className={`flex items-center justify-between text-sm px-4 py-3 rounded-xl ${isDark ? 'bg-indigo-900/40 text-indigo-300' : 'bg-indigo-50 text-indigo-700'}`}>
                    <span className="flex items-center gap-2"><Clock className="w-4 h-4" /> Tonight's Target:</span>
                    <span className="font-bold text-lg">{bedtimes[format(new Date(), 'EEEE')] || 'Not set'}</span>
                  </div>

                  {/* Night Routine Checklist Preview */}
                  <div className="space-y-3">
                    <h4 className={`font-medium text-sm ${subtextClass}`}>Evening Routine</h4>
                    <div className="space-y-2">
                      {nightRoutine.map((item, i) => (
                        <div key={item} className={`flex items-center gap-3 text-sm p-2 rounded-lg ${isDark ? 'bg-gray-800/30' : 'bg-white/40'}`}>
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isDark ? 'bg-indigo-900 text-indigo-300' : 'bg-indigo-100 text-indigo-600'}`}>
                            {i + 1}
                          </div>
                          <span className={`capitalize ${textClass}`}>{item.replace('_', ' ')}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Log Sleep Form */}
                  <div className={`border-t pt-4 ${isDark ? 'border-gray-700' : 'border-indigo-100'}`}>
                    <h4 className={`font-medium text-sm mb-3 ${subtextClass}`}>Log Sleep</h4>
                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      <div className="space-y-2">
                        <label className={`text-xs font-medium ${textClass}`}>Hours</label>
                        <Input
                          type="number"
                          step="0.5"
                          min="0"
                          max="24"
                          value={sleepForm.hours}
                          onChange={(e) => setSleepForm({...sleepForm, hours: parseFloat(e.target.value)})}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className={`text-xs font-medium ${textClass}`}>Quality</label>
                        <Select value={sleepForm.quality} onValueChange={(val) => setSleepForm({...sleepForm, quality: val})}>
                          <SelectTrigger className={isDark ? 'bg-gray-700 border-gray-600' : ''}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="excellent">Excellent</SelectItem>
                            <SelectItem value="good">Good</SelectItem>
                            <SelectItem value="fair">Fair</SelectItem>
                            <SelectItem value="poor">Poor</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Textarea
                      placeholder="Notes about your sleep... (optional)"
                      value={sleepForm.notes}
                      onChange={(e) => setSleepForm({...sleepForm, notes: e.target.value})}
                      rows={2}
                      className="mb-4"
                    />

                    <Button 
                      onClick={() => sleepMutation.mutate(sleepForm)}
                      className="w-full bg-purple-500 hover:bg-purple-600"
                    >
                      {todaysSleep ? 'Update Sleep Log' : 'Log Sleep'}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}