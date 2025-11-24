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

  const [moodForm, setMoodForm] = useState({ mood: 'good', notes: '' });
  const [sleepForm, setSleepForm] = useState({
    hours: todaysSleep?.hours || 7,
    quality: todaysSleep?.quality || 'good',
    notes: todaysSleep?.notes || ''
  });

  const waterPercentage = todaysWater ? (todaysWater.glasses / todaysWater.goal_glasses) * 100 : 0;

  const formatTime = (isoString) => {
    return format(new Date(isoString), 'h:mm a');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
            Wellness Tracker
          </h1>
          <p className="text-gray-600">Take care of your mind and body</p>
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
            requiredTasks={preferences?.required_self_care_tasks || []}
          />
        </motion.div>

        {/* Water Intake */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="shadow-lg border-0 bg-gradient-to-br from-blue-50 to-cyan-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Droplet className="w-7 h-7 text-blue-500" />
                Water Intake
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <div className="text-6xl font-bold text-blue-600 mb-2">
                  {todaysWater?.glasses || 0}
                </div>
                <p className="text-gray-600 text-lg">
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
          <Card className="shadow-lg border-0 bg-gradient-to-br from-pink-50 to-rose-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Heart className="w-7 h-7 text-pink-500" />
                Mood Check-In
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {todaysMoods && todaysMoods.length > 0 && (
                <div className="space-y-2 p-4 bg-white/50 rounded-lg">
                  <p className="font-semibold text-gray-700">Today's Check-ins:</p>
                  <div className="flex flex-wrap gap-2">
                    {todaysMoods.map((log, i) => (
                      <div key={i} className="px-4 py-2 bg-white rounded-full shadow-sm flex items-center gap-2">
                        <span className="text-2xl">{moodEmojis[log.mood]}</span>
                        <div className="text-sm">
                          <span className="text-gray-600 flex items-center gap-1">
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
                <label className="text-sm font-medium">How are you feeling right now?</label>
                <div className="grid grid-cols-5 gap-2">
                  {Object.entries(moodEmojis).map(([key, emoji]) => (
                    <button
                      key={key}
                      onClick={() => setMoodForm({...moodForm, mood: key})}
                      className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center ${
                        moodForm.mood === key
                          ? 'border-pink-500 bg-pink-50 scale-105'
                          : 'border-gray-200 hover:border-pink-300'
                      }`}
                    >
                      <span className="text-3xl mb-1">{emoji}</span>
                      <span className="text-xs text-gray-600 capitalize">{key}</span>
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

        {/* Sleep Tracker */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="shadow-lg border-0 bg-gradient-to-br from-purple-50 to-indigo-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Moon className="w-7 h-7 text-purple-500" />
                Sleep Log
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Hours of Sleep</label>
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
                  <label className="text-sm font-medium">Sleep Quality</label>
                  <Select value={sleepForm.quality} onValueChange={(val) => setSleepForm({...sleepForm, quality: val})}>
                    <SelectTrigger>
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
              />

              <Button 
                onClick={() => sleepMutation.mutate(sleepForm)}
                className="w-full bg-purple-500 hover:bg-purple-600"
              >
                {todaysSleep ? 'Update Sleep Log' : 'Log Sleep'}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}