import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { 
  Sun, Moon, Coffee, Utensils, Droplet, Pill, Heart, BookOpen, 
  Dumbbell, ShowerHead, Sparkles, Check, Pencil, X, List, Grid3X3,
  ChevronDown, ChevronUp, PawPrint, Bell, Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';

const getMealLabels = (gender) => {
  const isFemale = gender === 'female';
  return {
    breakfast: isFemale ? '👑 Eat like a queen' : '👑 Eat like a king',
    lunch: isFemale ? '👸 Eat like a princess' : '🤴 Eat like a prince', 
    dinner: '🥄 Eat like a pauper'
  };
};

// All possible daily tasks in chronological order
const getDailyTasks = (preferences, mealLabels) => {
  const tasks = [];
  
  // Morning
  tasks.push({ id: 'bible_reading_morning', label: 'Morning Bible reading', icon: BookOpen, color: 'text-amber-600', time: 'morning', showIf: preferences?.is_bible_believer });
  tasks.push({ id: 'drank_water', label: 'Drink water', sublabel: 'Start your day hydrated', icon: Droplet, color: 'text-sky-500', time: 'morning' });
  tasks.push({ id: 'shower_completed', label: 'Take a shower', icon: ShowerHead, color: 'text-blue-500', time: 'morning' });
  tasks.push({ id: 'brushed_teeth_morning', label: 'Brush teeth', sublabel: 'Morning', icon: Sparkles, color: 'text-cyan-500', time: 'morning' });
  tasks.push({ id: 'breakfast_completed', label: 'Breakfast', sublabel: mealLabels.breakfast, icon: Coffee, color: 'text-orange-500', time: 'morning', hasMealNote: true });
  tasks.push({ id: 'took_medications', label: 'Take medications', icon: Pill, color: 'text-pink-500', time: 'morning', link: 'Medications' });
  tasks.push({ id: 'took_supplements', label: 'Take supplements', icon: Pill, color: 'text-amber-500', time: 'morning', link: 'Supplements' });
  
  // Midday
  tasks.push({ id: 'water_midday', label: 'Midday water', icon: Droplet, color: 'text-sky-500', time: 'midday', showIf: preferences?.enable_water_reminders !== false });
  tasks.push({ id: 'lunch_completed', label: 'Lunch', sublabel: mealLabels.lunch, icon: Utensils, color: 'text-green-500', time: 'midday', hasMealNote: true });
  tasks.push({ id: 'physical_activity', label: 'Physical activity', icon: Dumbbell, color: 'text-red-500', time: 'afternoon' });
  
  // Afternoon/Evening
  tasks.push({ id: 'water_afternoon', label: 'Afternoon water', icon: Droplet, color: 'text-sky-500', time: 'afternoon', showIf: preferences?.enable_water_reminders !== false });
  tasks.push({ id: 'dinner_completed', label: 'Dinner', sublabel: mealLabels.dinner, icon: Utensils, color: 'text-purple-500', time: 'evening', hasMealNote: true });
  tasks.push({ id: 'water_evening', label: 'Evening water', icon: Droplet, color: 'text-sky-500', time: 'evening', showIf: preferences?.enable_water_reminders !== false });
  
  // Night
  tasks.push({ id: 'brushed_teeth_night', label: 'Brush teeth', sublabel: 'Night', icon: Sparkles, color: 'text-indigo-500', time: 'night' });
  tasks.push({ id: 'bible_reading_night', label: 'Night Bible reading', icon: BookOpen, color: 'text-indigo-600', time: 'night', showIf: preferences?.is_bible_believer });
  
  return tasks.filter(t => t.showIf === undefined || t.showIf);
};

const timeLabels = {
  morning: { label: 'Morning', icon: Sun, color: 'text-amber-500', bg: 'bg-amber-50' },
  midday: { label: 'Midday', icon: Sun, color: 'text-yellow-500', bg: 'bg-yellow-50' },
  afternoon: { label: 'Afternoon', icon: Sun, color: 'text-orange-500', bg: 'bg-orange-50' },
  evening: { label: 'Evening', icon: Moon, color: 'text-purple-500', bg: 'bg-purple-50' },
  night: { label: 'Night', icon: Moon, color: 'text-indigo-500', bg: 'bg-indigo-50' }
};

export default function MyDaySection({ 
  selfCareLog, 
  onToggleTask, 
  onUpdateMealNotes,
  preferences,
  medicationTasks = [],
  supplementTasks = [],
  petTasks = [],
  careReminders = [],
  viewMode = 'detailed' // 'detailed' or 'compact'
}) {
  const [editingMeal, setEditingMeal] = useState(null);
  const [mealNoteInput, setMealNoteInput] = useState('');
  const [expandedSections, setExpandedSections] = useState(['morning', 'midday', 'afternoon', 'evening', 'night']);
  const [localViewMode, setLocalViewMode] = useState(viewMode);
  
  const mealLabels = getMealLabels(preferences?.gender);
  const tasks = getDailyTasks(preferences, mealLabels);
  const displayMode = preferences?.completed_tasks_display || 'show_checked';
  
  const getMealNoteKey = (taskId) => taskId.replace('_completed', '_notes');
  
  const handleEditMeal = (taskId) => {
    const noteKey = getMealNoteKey(taskId);
    setMealNoteInput(selfCareLog?.[noteKey] || '');
    setEditingMeal(taskId);
  };
  
  const handleSaveMealNote = () => {
    if (editingMeal && onUpdateMealNotes) {
      const noteKey = getMealNoteKey(editingMeal);
      onUpdateMealNotes(noteKey, mealNoteInput);
    }
    setEditingMeal(null);
    setMealNoteInput('');
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const isTaskComplete = (taskId) => selfCareLog?.[taskId];
  
  const getVisibleTasks = (sectionTasks) => {
    if (displayMode === 'hide') {
      return sectionTasks.filter(t => !isTaskComplete(t.id));
    }
    if (displayMode === 'move_to_bottom') {
      const incomplete = sectionTasks.filter(t => !isTaskComplete(t.id));
      const complete = sectionTasks.filter(t => isTaskComplete(t.id));
      return [...incomplete, ...complete];
    }
    return sectionTasks;
  };

  const completedCount = tasks.filter(t => isTaskComplete(t.id)).length;
  const totalCount = tasks.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Group tasks by time
  const tasksByTime = {};
  tasks.forEach(task => {
    if (!tasksByTime[task.time]) tasksByTime[task.time] = [];
    tasksByTime[task.time].push(task);
  });

  if (localViewMode === 'compact') {
    return (
      <Card className="shadow-lg border-0 bg-gradient-to-br from-teal-50 to-cyan-50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Sun className="w-6 h-6 text-amber-500" />
              My Day
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocalViewMode('detailed')}
                className="h-8"
              >
                <List className="w-4 h-4 mr-1" /> Detailed
              </Button>
              <Badge variant={completedCount === totalCount ? "default" : "secondary"} 
                     className={completedCount === totalCount ? "bg-green-500" : ""}>
                {progressPercent}%
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {tasks.map((task) => {
              const Icon = task.icon;
              const isComplete = isTaskComplete(task.id);
              if (displayMode === 'hide' && isComplete) return null;
              
              return (
                <button
                  key={task.id}
                  onClick={() => onToggleTask(task.id, !isComplete)}
                  className={`p-2.5 rounded-xl border-2 transition-all ${
                    isComplete 
                      ? 'border-green-400 bg-green-100' 
                      : 'border-gray-200 bg-white hover:border-teal-300'
                  }`}
                  title={task.label}
                >
                  <Icon className={`w-5 h-5 ${isComplete ? 'text-green-500' : task.color}`} />
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg border-0 bg-gradient-to-br from-teal-50 to-cyan-50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Sun className="w-6 h-6 text-amber-500" />
            My Day
          </CardTitle>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocalViewMode('compact')}
              className="h-8"
            >
              <Grid3X3 className="w-4 h-4 mr-1" /> Compact
            </Button>
            <Badge variant={completedCount === totalCount ? "default" : "secondary"} 
                   className={completedCount === totalCount ? "bg-green-500" : ""}>
              {completedCount}/{totalCount} • {progressPercent}%
            </Badge>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
          <motion.div 
            className="bg-gradient-to-r from-teal-500 to-green-500 h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {Object.entries(tasksByTime).map(([time, sectionTasks]) => {
          const timeInfo = timeLabels[time];
          const TimeIcon = timeInfo.icon;
          const visibleTasks = getVisibleTasks(sectionTasks);
          const sectionComplete = sectionTasks.every(t => isTaskComplete(t.id));
          const isExpanded = expandedSections.includes(time);
          
          if (visibleTasks.length === 0) return null;
          
          return (
            <div key={time} className={`rounded-xl ${timeInfo.bg} overflow-hidden`}>
              <button
                onClick={() => toggleSection(time)}
                className="w-full p-3 flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <TimeIcon className={`w-5 h-5 ${timeInfo.color}`} />
                  <span className="font-semibold text-gray-700">{timeInfo.label}</span>
                  {sectionComplete && <Check className="w-4 h-4 text-green-500" />}
                </div>
                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="px-3 pb-3 space-y-2"
                  >
                    {visibleTasks.map((task) => {
                      const Icon = task.icon;
                      const isComplete = isTaskComplete(task.id);
                      const mealNoteKey = getMealNoteKey(task.id);
                      
                      return (
                        <div key={task.id}>
                          <div
                            className={`flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer ${
                              isComplete 
                                ? 'bg-green-100 border-2 border-green-300' 
                                : 'bg-white border-2 border-gray-100 hover:border-teal-300'
                            }`}
                            onClick={() => onToggleTask(task.id, !isComplete)}
                          >
                            <Checkbox checked={isComplete} className="pointer-events-none" />
                            <Icon className={`w-5 h-5 ${isComplete ? 'text-green-500' : task.color}`} />
                            <div className="flex-1">
                              <span className={`font-medium ${isComplete ? 'text-green-700 line-through' : 'text-gray-700'}`}>
                                {task.label}
                              </span>
                              {task.sublabel && (
                                <p className="text-xs text-gray-500">{task.sublabel}</p>
                              )}
                              {task.hasMealNote && selfCareLog?.[mealNoteKey] && editingMeal !== task.id && (
                                <p className="text-sm text-gray-500 italic mt-1">
                                  📝 {selfCareLog[mealNoteKey]}
                                </p>
                              )}
                            </div>
                            
                            {task.hasMealNote && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditMeal(task.id);
                                }}
                                className="p-2 hover:bg-gray-100 rounded-lg"
                              >
                                <Pencil className="w-4 h-4 text-gray-400" />
                              </button>
                            )}
                            
                            {task.link && (
                              <Link 
                                to={createPageUrl(task.link)}
                                onClick={(e) => e.stopPropagation()}
                                className="p-2 hover:bg-gray-100 rounded-lg"
                              >
                                <Clock className="w-4 h-4 text-gray-400" />
                              </Link>
                            )}
                          </div>
                          
                          {/* Meal note input */}
                          <AnimatePresence>
                            {editingMeal === task.id && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-2 overflow-hidden"
                              >
                                <div className="flex gap-2 p-3 bg-white rounded-xl border-2 border-gray-200">
                                  <Input
                                    placeholder="What did you eat?"
                                    value={mealNoteInput}
                                    onChange={(e) => setMealNoteInput(e.target.value)}
                                    className="flex-1"
                                    autoFocus
                                    onClick={(e) => e.stopPropagation()}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleSaveMealNote();
                                      if (e.key === 'Escape') setEditingMeal(null);
                                    }}
                                  />
                                  <Button size="sm" onClick={handleSaveMealNote} className="bg-green-500 hover:bg-green-600">
                                    <Check className="w-4 h-4" />
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={() => setEditingMeal(null)}>
                                    <X className="w-4 h-4" />
                                  </Button>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
        
        {/* Quick links to other trackers */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2">
          <Link to={createPageUrl('Medications')}>
            <Button variant="outline" size="sm" className="w-full">
              <Pill className="w-4 h-4 mr-1 text-pink-500" /> Medications
            </Button>
          </Link>
          <Link to={createPageUrl('Supplements')}>
            <Button variant="outline" size="sm" className="w-full">
              <Pill className="w-4 h-4 mr-1 text-amber-500" /> Supplements
            </Button>
          </Link>
          <Link to={createPageUrl('PetCare')}>
            <Button variant="outline" size="sm" className="w-full">
              <PawPrint className="w-4 h-4 mr-1 text-orange-500" /> Pet Care
            </Button>
          </Link>
          <Link to={createPageUrl('CareReminders')}>
            <Button variant="outline" size="sm" className="w-full">
              <Bell className="w-4 h-4 mr-1 text-purple-500" /> Reminders
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}