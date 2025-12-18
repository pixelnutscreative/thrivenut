import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Plus, Play, Timer, Flame, Dumbbell, MapPin, Trash2, Calendar, ChevronRight, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../components/shared/useTheme';

export default function ActivityTracker() {
  const queryClient = useQueryClient();
  const { isDark, bgClass, textClass, cardBgClass, primaryColor } = useTheme();
  const today = format(new Date(), 'yyyy-MM-dd');
  
  const [activeTab, setActiveTab] = useState('log');
  const [mode, setMode] = useState('simple');
  const [showForm, setShowForm] = useState(false);
  
  // Simple Form State
  const [simpleForm, setSimpleForm] = useState({
    simple_activity: '',
    duration_minutes: 30,
    intensity: 'medium',
    location_type: 'indoor',
    calories_burned: '',
    notes: ''
  });

  // Advanced Form State
  const [advancedForm, setAdvancedForm] = useState({
    name: 'Full Body',
    exercises: [
      { name: '', sets: [{ reps: '', weight: '', completed: false }] }
    ],
    notes: '',
    duration_minutes: ''
  });

  const { data: activities = [] } = useQuery({
    queryKey: ['activities'],
    queryFn: async () => base44.entities.ActivityLog.filter({ date: today }),
  });

  const { data: workouts = [] } = useQuery({
    queryKey: ['workouts'],
    queryFn: async () => base44.entities.WorkoutSession.filter({ date: today }),
  });

  const createActivityMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.entities.ActivityLog.create({
        date: today,
        mode: mode,
        ...data
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      setShowForm(false);
      setSimpleForm({
        simple_activity: '',
        duration_minutes: 30,
        intensity: 'medium',
        location_type: 'indoor',
        calories_burned: '',
        notes: ''
      });
    }
  });

  const createWorkoutMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.entities.WorkoutSession.create({
        date: today,
        ...data
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
      setShowForm(false);
      setAdvancedForm({
        name: 'Full Body',
        exercises: [{ name: '', sets: [{ reps: '', weight: '', completed: false }] }],
        notes: '',
        duration_minutes: ''
      });
    }
  });

  const handleSimpleSubmit = () => {
    if (!simpleForm.simple_activity) return;
    createActivityMutation.mutate({
      ...simpleForm,
      calories_burned: simpleForm.calories_burned ? parseInt(simpleForm.calories_burned) : undefined
    });
  };

  const handleAdvancedSubmit = () => {
    if (!advancedForm.name) return;
    // Clean up empty exercises
    const cleanExercises = advancedForm.exercises.filter(ex => ex.name.trim() !== '');
    if (cleanExercises.length === 0) return;

    createWorkoutMutation.mutate({
      name: advancedForm.name,
      exercises: cleanExercises,
      notes: advancedForm.notes,
      duration_minutes: advancedForm.duration_minutes ? parseInt(advancedForm.duration_minutes) : undefined
    });
  };

  const addExercise = () => {
    setAdvancedForm({
      ...advancedForm,
      exercises: [...advancedForm.exercises, { name: '', sets: [{ reps: '', weight: '', completed: false }] }]
    });
  };

  const addSet = (exerciseIndex) => {
    const newExercises = [...advancedForm.exercises];
    newExercises[exerciseIndex].sets.push({ reps: '', weight: '', completed: false });
    setAdvancedForm({ ...advancedForm, exercises: newExercises });
  };

  const updateExercise = (index, field, value) => {
    const newExercises = [...advancedForm.exercises];
    newExercises[index][field] = value;
    setAdvancedForm({ ...advancedForm, exercises: newExercises });
  };

  const updateSet = (exIndex, setIndex, field, value) => {
    const newExercises = [...advancedForm.exercises];
    newExercises[exIndex].sets[setIndex][field] = value;
    setAdvancedForm({ ...advancedForm, exercises: newExercises });
  };

  const intensityColors = {
    low: 'bg-blue-100 text-blue-700',
    medium: 'bg-green-100 text-green-700',
    high: 'bg-orange-100 text-orange-700',
    extreme: 'bg-red-100 text-red-700'
  };

  const commonActivities = [
    "Walking", "Running", "Yoga", "Strength Training", "Cycling", 
    "Swimming", "HIIT", "Pilates", "Hiking", "Dancing", "Cleaning"
  ];

  return (
    <div className={`min-h-screen ${bgClass} ${textClass} p-4 md:p-8`}>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-green-500 to-teal-500 bg-clip-text text-transparent">
              Activity Tracker
            </h1>
            <p className="text-gray-500">Track your movement and workouts</p>
          </div>
          <Button 
            onClick={() => setShowForm(!showForm)}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Plus className="w-5 h-5 mr-2" />
            Log Activity
          </Button>
        </div>

        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <Card className={`${cardBgClass} border-green-200`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Log Workout</CardTitle>
                    <div className="flex bg-gray-100 rounded-lg p-1">
                      <button
                        onClick={() => setMode('simple')}
                        className={`px-3 py-1 text-sm rounded-md transition-all ${mode === 'simple' ? 'bg-white shadow text-green-700 font-medium' : 'text-gray-500'}`}
                      >
                        Simple
                      </button>
                      <button
                        onClick={() => setMode('advanced')}
                        className={`px-3 py-1 text-sm rounded-md transition-all ${mode === 'advanced' ? 'bg-white shadow text-green-700 font-medium' : 'text-gray-500'}`}
                      >
                        Advanced
                      </button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {mode === 'simple' ? (
                    <>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Activity Type</label>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {commonActivities.map(act => (
                            <Badge 
                              key={act} 
                              variant="outline" 
                              className={`cursor-pointer hover:bg-green-50 ${simpleForm.simple_activity === act ? 'bg-green-100 border-green-300' : ''}`}
                              onClick={() => setSimpleForm({...simpleForm, simple_activity: act})}
                            >
                              {act}
                            </Badge>
                          ))}
                        </div>
                        <Input 
                          placeholder="Or type custom activity..." 
                          value={simpleForm.simple_activity}
                          onChange={(e) => setSimpleForm({...simpleForm, simple_activity: e.target.value})}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Duration (min)</label>
                          <div className="flex items-center gap-2">
                            <Timer className="w-4 h-4 text-gray-500" />
                            <Input 
                              type="number" 
                              value={simpleForm.duration_minutes}
                              onChange={(e) => setSimpleForm({...simpleForm, duration_minutes: parseInt(e.target.value)})}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Calories (est)</label>
                          <div className="flex items-center gap-2">
                            <Flame className="w-4 h-4 text-orange-500" />
                            <Input 
                              type="number" 
                              placeholder="Optional"
                              value={simpleForm.calories_burned}
                              onChange={(e) => setSimpleForm({...simpleForm, calories_burned: e.target.value})}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Intensity</label>
                          <Select value={simpleForm.intensity} onValueChange={(v) => setSimpleForm({...simpleForm, intensity: v})}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">Low (Easy)</SelectItem>
                              <SelectItem value="medium">Medium (Moderate)</SelectItem>
                              <SelectItem value="high">High (Hard)</SelectItem>
                              <SelectItem value="extreme">Extreme (All Out)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Location</label>
                          <Select value={simpleForm.location_type} onValueChange={(v) => setSimpleForm({...simpleForm, location_type: v})}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="indoor">Indoor</SelectItem>
                              <SelectItem value="outdoor">Outdoor</SelectItem>
                              <SelectItem value="gym">Gym</SelectItem>
                              <SelectItem value="home">Home</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Notes</label>
                        <Textarea 
                          placeholder="How did it feel?" 
                          value={simpleForm.notes}
                          onChange={(e) => setSimpleForm({...simpleForm, notes: e.target.value})}
                        />
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                        <Button onClick={handleSimpleSubmit} className="bg-green-600 hover:bg-green-700">Save Activity</Button>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Workout Name / Type</label>
                        <Input 
                          placeholder="e.g. Push Day, Leg Day, Full Body"
                          value={advancedForm.name}
                          onChange={(e) => setAdvancedForm({...advancedForm, name: e.target.value})}
                        />
                      </div>

                      {advancedForm.exercises.map((ex, exIndex) => (
                        <div key={exIndex} className="p-4 bg-gray-50 rounded-lg border space-y-3">
                          <div className="flex gap-2">
                            <Input 
                              placeholder={`Exercise ${exIndex + 1} Name`}
                              value={ex.name}
                              onChange={(e) => updateExercise(exIndex, 'name', e.target.value)}
                              className="font-medium"
                            />
                            <Button variant="ghost" size="icon" onClick={() => {
                              const newEx = [...advancedForm.exercises];
                              newEx.splice(exIndex, 1);
                              setAdvancedForm({...advancedForm, exercises: newEx});
                            }}>
                              <Trash2 className="w-4 h-4 text-red-400" />
                            </Button>
                          </div>

                          <div className="space-y-2">
                            <div className="grid grid-cols-3 gap-2 text-xs font-medium text-gray-500 px-1">
                              <span>Reps</span>
                              <span>Weight</span>
                              <span>Set</span>
                            </div>
                            {ex.sets.map((set, setIndex) => (
                              <div key={setIndex} className="grid grid-cols-3 gap-2 items-center">
                                <Input 
                                  placeholder="Reps" 
                                  type="number"
                                  value={set.reps}
                                  onChange={(e) => updateSet(exIndex, setIndex, 'reps', e.target.value)}
                                  className="h-8"
                                />
                                <Input 
                                  placeholder="Lbs/Kg" 
                                  type="number"
                                  value={set.weight}
                                  onChange={(e) => updateSet(exIndex, setIndex, 'weight', e.target.value)}
                                  className="h-8"
                                />
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-gray-400">#{setIndex + 1}</span>
                                </div>
                              </div>
                            ))}
                            <Button variant="outline" size="sm" onClick={() => addSet(exIndex)} className="w-full text-xs h-7 mt-2">
                              <Plus className="w-3 h-3 mr-1" /> Add Set
                            </Button>
                          </div>
                        </div>
                      ))}

                      <Button variant="outline" onClick={addExercise} className="w-full border-dashed">
                        <Plus className="w-4 h-4 mr-2" /> Add Exercise
                      </Button>

                      <div className="space-y-2 pt-2">
                        <label className="text-sm font-medium">Notes</label>
                        <Textarea 
                          placeholder="How did the workout go?"
                          value={advancedForm.notes}
                          onChange={(e) => setAdvancedForm({...advancedForm, notes: e.target.value})}
                        />
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                        <Button onClick={handleAdvancedSubmit} className="bg-blue-600 hover:bg-blue-700">Save Workout</Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Today's Activity */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-500" />
            Today's Movement
          </h2>
          
          {activities.length === 0 && workouts.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center text-gray-400">
                <Dumbbell className="w-12 h-12 mx-auto mb-2 opacity-20" />
                <p>No activity logged today yet.</p>
                <p className="text-sm">Get moving and log it!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {workouts.map((workout) => (
                <motion.div
                  key={workout.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card className={`${cardBgClass} hover:shadow-md transition-all border-l-4 border-l-blue-500`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                            <Dumbbell className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="font-bold text-lg">{workout.name}</h3>
                            <p className="text-xs text-gray-500">{workout.exercises?.length || 0} Exercises</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        {workout.exercises?.map((ex, i) => (
                          <div key={i} className="text-sm border-b border-gray-100 pb-2 last:border-0 last:pb-0">
                            <p className="font-medium">{ex.name}</p>
                            <div className="flex gap-2 flex-wrap mt-1">
                              {ex.sets?.map((set, s) => (
                                <Badge key={s} variant="secondary" className="text-xs font-normal">
                                  {set.reps} x {set.weight}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}

              {activities.map((activity) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card className={`${cardBgClass} hover:shadow-md transition-all`}>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${intensityColors[activity.intensity || 'medium']}`}>
                          {activity.mode === 'advanced' ? <Dumbbell className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{activity.simple_activity || 'Workout'}</h3>
                          <div className="flex items-center gap-3 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Timer className="w-3 h-3" /> {activity.duration_minutes} min
                            </span>
                            {activity.calories_burned && (
                              <span className="flex items-center gap-1">
                                <Flame className="w-3 h-3 text-orange-400" /> {activity.calories_burned} cal
                              </span>
                            )}
                            <span className="flex items-center gap-1 capitalize">
                              <MapPin className="w-3 h-3" /> {activity.location_type}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline" className="capitalize">{activity.intensity}</Badge>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}